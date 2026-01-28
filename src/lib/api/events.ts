/**
 * SSE Client - Real-time event stream from Gas Town API
 */

import { agentsStore, type Agent, type AgentRole } from '$lib/stores/agents.svelte';
import { tasksStore, type Task, type TaskType } from '$lib/stores/tasks.svelte';
import { rigsStore, type Rig, type RigStatus } from '$lib/stores/rigs.svelte';

const VALID_AGENT_ROLES = new Set<AgentRole>(['polecat', 'witness', 'deacon', 'refinery', 'crew', 'overseer']);
const VALID_TASK_TYPES = new Set<TaskType>(['code', 'data', 'general']);
import { mailStore, transformMessage, type MailMessage } from '$lib/stores/mail.svelte';
import { convoysStore, type Convoy } from '$lib/stores/convoys.svelte';
import { feedStore, type FeedEvent } from '$lib/stores/feed.svelte';
import { mergeQueueStore, type MergeRequest } from '$lib/stores/mergequeue.svelte';
import { gatesStore, type Gate } from '$lib/stores/gates.svelte';
import { dogsStore, type Dog } from '$lib/stores/dogs.svelte';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Raw message data from SSE before transformation.
 * Fields are flexible as different sources (witness/deacon/dog) use different formats.
 */
interface RawMailMessage {
	id: string;
	subject?: string;
	title?: string;
	body?: string;
	description?: string;
	from?: string;
	created_by?: string;
	to?: string;
	assignee?: string;
	read?: boolean;
	status?: string;
	priority?: number;
	type?: string;
	category?: string;
	createdAt?: string;
	created_at?: string;
	labels?: string[];
	threadId?: string;
	thread_id?: string;
	replyTo?: string;
	reply_to?: string;
	rig_name?: string;
	rigName?: string;
}

interface MailEventData {
	messages: RawMailMessage[];
	total: number;
	unread: number;
}

interface ConvoyEventData {
	convoys: Array<{
		id: string;
		title: string;
		description: string;
		status: 'open' | 'closed';
		displayStatus: 'pending' | 'in_progress' | 'blocked' | 'completed';
		priority: number;
		assignee: string | null;
		trackedCount: number;
		createdAt: string;
		updatedAt: string;
		labels: string[];
	}>;
	total: number;
}

interface FeedEventData {
	events: FeedEvent[];
	total: number;
}

interface MergeQueueEventData {
	items: MergeRequest[];
	total: number;
}

interface GatesEventData {
	items: Gate[];
	total: number;
}

interface DogsEventData {
	items: Dog[];
	total: number;
}

interface SSEMessage {
	type: 'agents' | 'tasks' | 'rigs' | 'mail' | 'convoys' | 'feed' | 'mergequeue' | 'gates' | 'dogs' | 'status' | 'heartbeat' | 'error';
	data: unknown;
	timestamp: string;
}

interface AgentEventData {
	agents: Array<{
		id: string;
		name: string;
		address: string;
		role: string;
		status: 'running' | 'idle' | 'offline';
		hasWork: boolean;
		unreadMail: number;
		rig?: string;
	}>;
	total: number;
}

interface TaskEventData {
	tasks: Array<{
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
	}>;
	total: number;
}

interface RigEventData {
	rigs: Array<{
		name: string;
		status: string;
		witnessRunning: boolean;
		refineryRunning: boolean;
		polecatCount: number;
		crewCount: number;
		agents: Array<{
			id: string;
			name: string;
			address: string;
			role: string;
			status: 'running' | 'idle' | 'offline';
			hasWork: boolean;
			unreadMail: number;
		}>;
	}>;
	total: number;
}

type EventCallback = (status: ConnectionStatus) => void;

/**
 * Map CLI status string to RigStatus.
 */
function deriveRigStatus(cliStatus: string): RigStatus {
	const normalized = cliStatus.toUpperCase();
	if (normalized === 'OPERATIONAL') return 'active';
	if (normalized === 'PARKED') return 'parked';
	if (normalized === 'DOCKED') return 'docked';
	if (normalized === 'ERROR' || normalized === 'UNKNOWN') return 'error';
	return 'parked';
}

class EventStreamClient {
	#eventSource: EventSource | null = null;
	#status: ConnectionStatus = 'disconnected';
	#reconnectAttempts = 0;
	#maxReconnectAttempts = 20;
	#reconnectDelay = 1000;
	#listeners: Set<EventCallback> = new Set();
	#reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	get status(): ConnectionStatus {
		return this.#status;
	}

	get isConnected(): boolean {
		return this.#status === 'connected';
	}

	/**
	 * Subscribe to connection status changes
	 */
	subscribe(callback: EventCallback): () => void {
		this.#listeners.add(callback);
		callback(this.#status);
		return () => this.#listeners.delete(callback);
	}

	#notifyListeners() {
		for (const listener of this.#listeners) {
			listener(this.#status);
		}
	}

	/**
	 * Safely parse an SSE event, logging and discarding malformed messages
	 * instead of crashing the stream.
	 */
	#parseEvent<T>(eventType: string, event: MessageEvent, handler: (data: T) => void): void {
		try {
			const message = JSON.parse(event.data) as SSEMessage;
			handler(message.data as T);
		} catch (err) {
			console.error(`[EventStream] Failed to parse ${eventType} event:`, err);
		}
	}

	#setStatus(status: ConnectionStatus) {
		this.#status = status;
		this.#notifyListeners();
	}

	/**
	 * Connect to the SSE endpoint
	 */
	connect(): void {
		if (this.#eventSource || this.#status === 'connecting') {
			console.log('[EventStream] Already connected or connecting');
			return;
		}

		console.log('[EventStream] Connecting to SSE...');
		this.#setStatus('connecting');

		try {
			this.#eventSource = new EventSource('/api/gastown/events');
			console.log('[EventStream] EventSource created');

			this.#eventSource.addEventListener('status', (event: MessageEvent) => {
				try {
					console.log('[EventStream] Received status event');
					const message = JSON.parse(event.data) as SSEMessage;
					if ((message.data as { connected?: boolean }).connected) {
						console.log('[EventStream] Connected!');
						this.#setStatus('connected');
						this.#reconnectAttempts = 0;
					}
				} catch (err) {
					console.error('[EventStream] Failed to parse status event:', err);
				}
			});

			this.#eventSource.addEventListener('agents', (event: MessageEvent) => {
				this.#parseEvent<AgentEventData>('agents', event, (data) => this.#handleAgentsUpdate(data));
			});

			this.#eventSource.addEventListener('tasks', (event: MessageEvent) => {
				this.#parseEvent<TaskEventData>('tasks', event, (data) => this.#handleTasksUpdate(data));
			});

			this.#eventSource.addEventListener('rigs', (event: MessageEvent) => {
				this.#parseEvent<RigEventData>('rigs', event, (data) => this.#handleRigsUpdate(data));
			});

			this.#eventSource.addEventListener('mail', (event: MessageEvent) => {
				this.#parseEvent<MailEventData>('mail', event, (data) => this.#handleMailUpdate(data));
			});

			this.#eventSource.addEventListener('convoys', (event: MessageEvent) => {
				this.#parseEvent<ConvoyEventData>('convoys', event, (data) => this.#handleConvoysUpdate(data));
			});

			this.#eventSource.addEventListener('feed', (event: MessageEvent) => {
				this.#parseEvent<FeedEventData>('feed', event, (data) => this.#handleFeedUpdate(data));
			});

			this.#eventSource.addEventListener('mergequeue', (event: MessageEvent) => {
				this.#parseEvent<MergeQueueEventData>('mergequeue', event, (data) => this.#handleMergeQueueUpdate(data));
			});

			this.#eventSource.addEventListener('gates', (event: MessageEvent) => {
				this.#parseEvent<GatesEventData>('gates', event, (data) => this.#handleGatesUpdate(data));
			});

			this.#eventSource.addEventListener('dogs', (event: MessageEvent) => {
				this.#parseEvent<DogsEventData>('dogs', event, (data) => this.#handleDogsUpdate(data));
			});

			this.#eventSource.addEventListener('heartbeat', () => {
				// Heartbeats are silent — they just keep the connection alive
			});

			this.#eventSource.addEventListener('error', (event: MessageEvent) => {
				console.error('[EventStream] SSE error event:', event);
			});

			this.#eventSource.onerror = (err) => {
				console.error('[EventStream] Connection error:', err);
				this.#handleConnectionError();
			};
		} catch (err) {
			console.error('Failed to create EventSource:', err);
			this.#handleConnectionError();
		}
	}

	/**
	 * Disconnect from the SSE endpoint
	 */
	disconnect(): void {
		if (this.#reconnectTimer) {
			clearTimeout(this.#reconnectTimer);
			this.#reconnectTimer = null;
		}

		if (this.#eventSource) {
			this.#eventSource.close();
			this.#eventSource = null;
		}

		this.#setStatus('disconnected');
		this.#reconnectAttempts = 0;
	}

	/**
	 * Force reconnect (resets attempt counter and connects)
	 */
	reconnect(): void {
		this.disconnect();
		this.connect();
	}

	#handleConnectionError() {
		this.#eventSource?.close();
		this.#eventSource = null;
		this.#setStatus('error');

		// Attempt reconnection with exponential backoff
		if (this.#reconnectAttempts < this.#maxReconnectAttempts) {
			const delay = Math.min(this.#reconnectDelay * Math.pow(2, this.#reconnectAttempts), 30_000);
			this.#reconnectAttempts++;

			console.log(`SSE reconnecting in ${delay}ms (attempt ${this.#reconnectAttempts})`);

			this.#reconnectTimer = setTimeout(() => {
				this.connect();
			}, delay);
		} else {
			console.error('SSE max reconnect attempts reached');
		}
	}

	#handleAgentsUpdate(data: AgentEventData) {
		// Transform SSE data to Agent format, validating role values
		const agents: Agent[] = data.agents.map((a) => ({
			id: a.id,
			name: a.name,
			address: a.address,
			role: VALID_AGENT_ROLES.has(a.role as AgentRole) ? (a.role as AgentRole) : 'polecat',
			status: a.status,
			hasWork: a.hasWork,
			unreadMail: a.unreadMail,
			rig: a.rig
		}));

		// Replace all agents in the store
		agentsStore.setItems(agents);
	}

	#handleTasksUpdate(data: TaskEventData) {
		// Transform SSE data to Task format, validating type values
		const tasks: Task[] = data.tasks.map((t) => ({
			id: t.id,
			title: t.title,
			description: t.description,
			type: VALID_TASK_TYPES.has(t.type as TaskType) ? (t.type as TaskType) : 'general',
			status: t.status,
			priority: t.priority,
			assignee: t.assignee,
			createdAt: t.createdAt,
			updatedAt: t.updatedAt,
			labels: t.labels
		}));

		// Replace all tasks in the store
		tasksStore.setItems(tasks);
	}

	#handleMailUpdate(data: MailEventData) {
		const messages: MailMessage[] = data.messages.map((m) => transformMessage(m));
		mailStore.setItems(messages);
	}

	#handleConvoysUpdate(data: ConvoyEventData) {
		const convoys: Convoy[] = data.convoys.map((c) => ({
			id: c.id,
			title: c.title,
			description: c.description,
			status: c.status,
			displayStatus: c.displayStatus,
			priority: c.priority,
			assignee: c.assignee,
			trackedCount: c.trackedCount,
			createdAt: c.createdAt,
			updatedAt: c.updatedAt,
			labels: c.labels
		}));
		convoysStore.setItems(convoys);
	}

	#handleFeedUpdate(data: FeedEventData) {
		feedStore.setItems(data.events);
	}

	#handleMergeQueueUpdate(data: MergeQueueEventData) {
		mergeQueueStore.setItems(data.items);
	}

	#handleGatesUpdate(data: GatesEventData) {
		gatesStore.setItems(data.items);
	}

	#handleDogsUpdate(data: DogsEventData) {
		dogsStore.setItems(data.items);
	}

	#handleRigsUpdate(data: RigEventData) {
		// Transform SSE rig data to Rig format
		const rigs: Rig[] = data.rigs.map((r) => ({
			name: r.name,
			status: deriveRigStatus(r.status),
			addedAt: '',
			gitUrl: '',
			hasWitness: r.witnessRunning ?? false,
			hasRefinery: r.refineryRunning ?? false,
			polecatCount: r.polecatCount ?? 0,
			crewCount: r.crewCount ?? 0,
			agents: (r.agents || []).map((a) => ({
				id: a.id || a.name,
				name: a.name,
				address: a.address || '',
				role: VALID_AGENT_ROLES.has(a.role.toLowerCase() as AgentRole) ? (a.role.toLowerCase() as AgentRole) : 'polecat',
				status: a.status || 'offline',
				hasWork: a.hasWork ?? false,
				unreadMail: a.unreadMail ?? 0
			}))
		}));

		rigsStore.setItems(rigs);
	}
}

export const eventStream = new EventStreamClient();
