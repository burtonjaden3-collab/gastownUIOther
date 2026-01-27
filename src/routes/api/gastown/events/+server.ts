/**
 * GET /api/gastown/events
 * Server-Sent Events endpoint for real-time updates
 *
 * Polls agent status via `gt rig status <name>` (per rig) and
 * task status via `bd list --json`. Does NOT use `gt status --json`
 * which hangs indefinitely.
 *
 * Emits: agents, rigs, tasks, status, heartbeat, error events.
 */

import type { RequestHandler } from './$types';
import {
	getProcessSupervisor,
	getRigNames,
	parseRigStatusOutput,
	getPollGate,
	type BdBead
} from '$lib/server/cli';

const POLL_INTERVAL = 10_000; // 10 seconds
const MAX_POLL_INTERVAL = 30000; // 30 seconds (backoff ceiling)
const BACKOFF_MULTIPLIER = 1.5;

interface AgentEvent {
	id: string;
	name: string;
	address: string;
	role: string;
	status: 'running' | 'idle' | 'offline';
	hasWork: boolean;
	unreadMail: number;
	rig?: string;
}

interface TaskEvent {
	id: string;
	title: string;
	description: string;
	type: string;
	status: 'pending' | 'in_progress' | 'blocked' | 'completed';
	priority: number;
	assignee: string | null;
	createdAt: string;
	updatedAt: string;
	labels: string[];
}

interface RigEvent {
	name: string;
	status: string;
	witnessRunning: boolean;
	refineryRunning: boolean;
	polecatCount: number;
	crewCount: number;
	agents: AgentEvent[];
}

interface MailEvent {
	id: string;
	from: string;
	to: string;
	subject: string;
	body?: string;
	type: string;
	priority: number;
	read: boolean;
	createdAt: string;
	readAt?: string;
	rig_name?: string;
	labels?: string[];
}

interface SSEMessage {
	type: 'agents' | 'tasks' | 'rigs' | 'mail' | 'convoys' | 'feed' | 'mergequeue' | 'gates' | 'dogs' | 'status' | 'heartbeat' | 'error';
	data: unknown;
	timestamp: string;
}

function formatSSE(message: SSEMessage): string {
	return `event: ${message.type}\ndata: ${JSON.stringify(message)}\n\n`;
}

export const GET: RequestHandler = async ({ request }) => {
	let supervisor;
	try {
		supervisor = getProcessSupervisor();
	} catch (err) {
		console.error('[SSE] Failed to get supervisor:', err);
		return new Response(JSON.stringify({ error: 'Failed to initialize' }), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	let isConnected = true;

	// Track previous state for change detection
	let prevAgentsHash = '';
	let prevTasksHash = '';
	let prevRigsHash = '';
	let prevMailHash = '';
	let prevConvoysHash = '';
	let prevFeedHash = '';
	let prevMergeQueueHash = '';
	let prevGatesHash = '';
	let prevDogsHash = '';
	let currentInterval = POLL_INTERVAL;
	let consecutiveFailures = 0;
	const MAX_CONSECUTIVE_FAILURES = 10;

	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			function safeEnqueue(data: Uint8Array) {
				if (!isConnected) return;
				try {
					controller.enqueue(data);
				} catch {
					// Controller already closed — client disconnected mid-poll
					isConnected = false;
				}
			}

			// Send initial connection message
			safeEnqueue(
				encoder.encode(
					formatSSE({
						type: 'status',
						data: { connected: true },
						timestamp: new Date().toISOString()
					})
				)
			);

			// Polling loop
			const gate = getPollGate();

			let pollInProgress = false;

			const poll = async () => {
				if (!isConnected) {
					pollInProgress = false;
					return;
				}

				// Prevent overlapping polls — if the previous cycle hasn't
				// finished, skip and wait for the next scheduled tick.
				if (pollInProgress) {
					if (isConnected) {
						setTimeout(poll, currentInterval);
					}
					return;
				}

				// If the gate is paused (daemon start/stop in progress),
				// send a heartbeat and reschedule without spawning CLI processes.
				if (gate.isPaused) {
					safeEnqueue(
						encoder.encode(
							formatSSE({
								type: 'heartbeat',
								data: { paused: true },
								timestamp: new Date().toISOString()
							})
						)
					);
					if (isConnected) {
						setTimeout(poll, currentInterval);
					}
					return;
				}

				pollInProgress = true;
				let pollHadFailure = false;

				try {
					// Step 1: Get agent + rig status from per-rig checks (parallel)
					const agents: AgentEvent[] = [];
					const rigs: RigEvent[] = [];

					let rigNames: string[] = [];
					try {
						rigNames = await getRigNames();
					} catch {
						pollHadFailure = true;
					}

					const rigResults = await Promise.all(
						rigNames.map(async (rigName): Promise<{ agents: AgentEvent[]; rig: RigEvent; failed: boolean }> => {
							try {
								const result = await supervisor.gt(
									['rig', 'status', rigName],
									{ timeout: 10_000 }
								);

								if (result.success && result.data) {
									const text =
										typeof result.data === 'string'
											? result.data
											: String(result.data);
									const parsed = parseRigStatusOutput(text);

									const rigAgents: AgentEvent[] = [];

									rigAgents.push({
										id: `${rigName}-witness`,
										name: 'witness',
										address: `${rigName}/witness`,
										role: 'witness',
										status: parsed.witnessRunning ? 'running' : 'offline',
										hasWork: false,
										unreadMail: 0,
										rig: rigName
									});

									rigAgents.push({
										id: `${rigName}-refinery`,
										name: 'refinery',
										address: `${rigName}/refinery`,
										role: 'refinery',
										status: parsed.refineryRunning ? 'running' : 'offline',
										hasWork: false,
										unreadMail: 0,
										rig: rigName
									});

									for (let i = 0; i < parsed.polecatCount; i++) {
										const entry = parsed.polecats[i];
										const polecatStatus = entry?.status ?? 'running';
										rigAgents.push({
											id: `${rigName}-polecat-${i}`,
											name: `polecat-${i}`,
											address: `${rigName}/polecat/${i}`,
											role: 'polecat',
											status: polecatStatus,
											hasWork: polecatStatus === 'running',
											unreadMail: 0,
											rig: rigName
										});
									}

									for (let i = 0; i < parsed.crewCount; i++) {
										const entry = parsed.crews[i];
										const crewStatus = entry?.status ?? 'idle';
										rigAgents.push({
											id: `${rigName}-crew-${i}`,
											name: `crew-${i}`,
											address: `${rigName}/crew/${i}`,
											role: 'crew',
											status: crewStatus,
											hasWork: crewStatus === 'running',
											unreadMail: 0,
											rig: rigName
										});
									}

									return {
										agents: rigAgents,
										rig: {
											name: rigName,
											status: parsed.status,
											witnessRunning: parsed.witnessRunning,
											refineryRunning: parsed.refineryRunning,
											polecatCount: parsed.polecatCount,
											crewCount: parsed.crewCount,
											agents: rigAgents
										},
										failed: false
									};
								}

								return {
									agents: [],
									rig: {
										name: rigName,
										status: 'unknown',
										witnessRunning: false,
										refineryRunning: false,
										polecatCount: 0,
										crewCount: 0,
										agents: []
									},
									failed: true
								};
							} catch {
								return {
									agents: [],
									rig: {
										name: rigName,
										status: 'error',
										witnessRunning: false,
										refineryRunning: false,
										polecatCount: 0,
										crewCount: 0,
										agents: []
									},
									failed: true
								};
							}
						})
					);

					for (const r of rigResults) {
						agents.push(...r.agents);
						rigs.push(r.rig);
						if (r.failed) pollHadFailure = true;
					}

					// Check for agent changes
					const agentsHash = JSON.stringify(agents);
					if (agentsHash !== prevAgentsHash) {
						prevAgentsHash = agentsHash;
						safeEnqueue(
							encoder.encode(
								formatSSE({
									type: 'agents',
									data: { agents, total: agents.length },
									timestamp: new Date().toISOString()
								})
							)
						);
					}

					// Check for rig changes
					const rigsHash = JSON.stringify(rigs);
					if (rigsHash !== prevRigsHash) {
						prevRigsHash = rigsHash;
						safeEnqueue(
							encoder.encode(
								formatSSE({
									type: 'rigs',
									data: { rigs, total: rigs.length },
									timestamp: new Date().toISOString()
								})
							)
						);
					}

					// Step 2: Fetch tasks
					const tasksResult = await supervisor.bd<BdBead[]>(
						['list', '--json'],
						{ timeout: 30_000 }
					);

					if (!tasksResult.success) {
						pollHadFailure = true;
					}

					if (tasksResult.success) {
						const beads = tasksResult.data || [];
						const tasks: TaskEvent[] = beads.map((bead) => ({
							id: bead.id,
							title: bead.title,
							description: bead.description,
							type: bead.issue_type || 'general',
							status: deriveTaskStatus(bead),
							priority: bead.priority,
							assignee: bead.assignee || null,
							createdAt: bead.created_at,
							updatedAt: bead.updated_at,
							labels: bead.labels || []
						}));

						// Check for task changes
						const tasksHash = JSON.stringify(tasks);
						if (tasksHash !== prevTasksHash) {
							prevTasksHash = tasksHash;
							safeEnqueue(
								encoder.encode(
									formatSSE({
										type: 'tasks',
										data: { tasks, total: tasks.length },
										timestamp: new Date().toISOString()
									})
								)
							);
						}
					}

					// Step 3: Fetch convoys
				try {
					const convoysResult = await supervisor.bd<BdBead[]>(
						['list', '--type=convoy', '--json'],
						{ timeout: 30_000 }
					);

					if (convoysResult.success) {
						const beads = convoysResult.data || [];
						const convoys = beads.map((bead) => ({
							id: bead.id,
							title: bead.title,
							description: bead.description,
							status: bead.status,
							displayStatus: deriveTaskStatus(bead),
							priority: bead.priority,
							assignee: bead.assignee || null,
							trackedCount: bead.children?.length ?? 0,
							createdAt: bead.created_at,
							updatedAt: bead.updated_at,
							labels: bead.labels || []
						}));

						const convoysHash = JSON.stringify(convoys);
						if (convoysHash !== prevConvoysHash) {
							prevConvoysHash = convoysHash;
							safeEnqueue(
								encoder.encode(
									formatSSE({
										type: 'convoys',
										data: { convoys, total: convoys.length },
										timestamp: new Date().toISOString()
									})
								)
							);
						}
					}
				} catch {
					// Convoy polling failure is non-fatal
				}

				// Step 4: Fetch feed events
				try {
					const feedResult = await supervisor.gt(
						['feed', '--plain', '--since', '5m'],
						{ timeout: 10_000 }
					);

					if (feedResult.success && feedResult.data) {
						const feedHash = JSON.stringify(feedResult.data);
						if (feedHash !== prevFeedHash) {
							prevFeedHash = feedHash;
							const raw = typeof feedResult.data === 'string' ? feedResult.data : String(feedResult.data);
							const events = raw.split('\n').filter(Boolean).slice(0, 200).map((line: string, i: number) => {
								const match = line.match(/^\[([^\]]+)\]\s+(\w+)\s+([^:]+):\s*(.*)$/);
								if (match) {
									return {
										id: `feed-${Date.now()}-${i}`,
										timestamp: match[1],
										type: match[2].toLowerCase(),
										source: 'system',
										actor: match[3].trim(),
										message: match[4].trim(),
										visibility: 'public'
									};
								}
								return {
									id: `feed-${Date.now()}-${i}`,
									timestamp: new Date().toISOString(),
									type: 'unknown',
									source: 'system',
									actor: 'system',
									message: line,
									visibility: 'public'
								};
							});
							safeEnqueue(
								encoder.encode(
									formatSSE({
										type: 'feed',
										data: { events, total: events.length },
										timestamp: new Date().toISOString()
									})
								)
							);
						}
					}
				} catch {
					// Feed polling failure is non-fatal
				}

				// Step 5: Fetch mail
					try {
						const mailResult = await supervisor.gt<MailEvent[]>(
							['mail', 'inbox', '--json', '--all'],
							{ timeout: 15_000 }
						);

						if (mailResult.success) {
							const messages = mailResult.data || [];
							const unread = messages.filter((m) => !m.read).length;
							const mailHash = JSON.stringify(messages);
							if (mailHash !== prevMailHash) {
								prevMailHash = mailHash;
								safeEnqueue(
									encoder.encode(
										formatSSE({
											type: 'mail',
											data: { messages, total: messages.length, unread },
											timestamp: new Date().toISOString()
										})
									)
								);
							}
						}
					} catch {
						// Mail polling failure is non-fatal
					}

					// Step 6: Fetch merge queue
					try {
						const mqResult = await supervisor.gt(
							['mq', '--json'],
							{ timeout: 15_000 }
						);

						if (mqResult.success && mqResult.data) {
							const mqHash = JSON.stringify(mqResult.data);
							if (mqHash !== prevMergeQueueHash) {
								prevMergeQueueHash = mqHash;
								const items = Array.isArray(mqResult.data) ? mqResult.data : [];
								safeEnqueue(
									encoder.encode(
										formatSSE({
											type: 'mergequeue',
											data: { items, total: items.length },
											timestamp: new Date().toISOString()
										})
									)
								);
							}
						}
					} catch {
						// Merge queue polling failure is non-fatal
					}

					// Step 7: Fetch gates
					try {
						const gatesResult = await supervisor.bd(
							['gate', 'list', '--json'],
							{ timeout: 15_000 }
						);

						if (gatesResult.success && gatesResult.data) {
							const gatesHash = JSON.stringify(gatesResult.data);
							if (gatesHash !== prevGatesHash) {
								prevGatesHash = gatesHash;
								const items = Array.isArray(gatesResult.data) ? gatesResult.data : [];
								safeEnqueue(
									encoder.encode(
										formatSSE({
											type: 'gates',
											data: { items, total: items.length },
											timestamp: new Date().toISOString()
										})
									)
								);
							}
						}
					} catch {
						// Gates polling failure is non-fatal
					}

					// Step 8: Fetch dogs
					try {
						const dogsResult = await supervisor.gt(
							['dog', 'list', '--json'],
							{ timeout: 15_000 }
						);

						if (dogsResult.success && dogsResult.data) {
							const dogsHash = JSON.stringify(dogsResult.data);
							if (dogsHash !== prevDogsHash) {
								prevDogsHash = dogsHash;
								const items = Array.isArray(dogsResult.data) ? dogsResult.data : [];
								safeEnqueue(
									encoder.encode(
										formatSSE({
											type: 'dogs',
											data: { items, total: items.length },
											timestamp: new Date().toISOString()
										})
									)
								);
							}
						}
					} catch {
						// Dogs polling failure is non-fatal
					}

					// Send heartbeat
					safeEnqueue(
						encoder.encode(
							formatSSE({
								type: 'heartbeat',
								data: {},
								timestamp: new Date().toISOString()
							})
						)
					);
				} catch (err) {
					pollHadFailure = true;
					safeEnqueue(
						encoder.encode(
							formatSSE({
								type: 'error',
								data: {
									message:
										err instanceof Error ? err.message : 'Unknown error'
								},
								timestamp: new Date().toISOString()
							})
						)
					);
				}

				// Backoff on failure, reset on success
				if (pollHadFailure) {
					consecutiveFailures++;
					currentInterval = Math.min(
						currentInterval * BACKOFF_MULTIPLIER,
						MAX_POLL_INTERVAL
					);

					// Stop polling after too many consecutive failures
					if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
						safeEnqueue(
							encoder.encode(
								formatSSE({
									type: 'error',
									data: {
										message: 'Too many consecutive failures — stopping event stream'
									},
									timestamp: new Date().toISOString()
								})
							)
						);
						isConnected = false;
						pollInProgress = false;
						return;
					}
				} else {
					consecutiveFailures = 0;
					currentInterval = POLL_INTERVAL;
				}

				pollInProgress = false;

				// Schedule next poll only after this cycle finishes
				if (isConnected) {
					setTimeout(poll, currentInterval);
				}
			};

			// Start polling
			poll();
		},

		cancel() {
			isConnected = false;
		}
	});

	// Handle client disconnect
	request.signal.addEventListener('abort', () => {
		isConnected = false;
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

function deriveTaskStatus(
	bead: BdBead
): 'pending' | 'in_progress' | 'blocked' | 'completed' {
	if (bead.status === 'closed') return 'completed';
	if ((bead.blocked_by_count ?? 0) > 0) return 'blocked';
	if (bead.assignee || bead.hook_bead) return 'in_progress';
	return 'pending';
}
