/**
 * GET /api/gastown/agents
 *
 * Returns agent list by:
 * 1. Reading rig registry from mayor/rigs.json (on disk)
 * 2. Checking per-rig status via `gt rig status <name>`
 *
 * Includes witness, refinery, polecat, and crew agents.
 * Does NOT use `gt status --json` which hangs indefinitely.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getProcessSupervisor,
	getRigNames,
	parseRigStatusOutput
} from '$lib/server/cli';

export interface Agent {
	id: string;
	name: string;
	address: string;
	role: string;
	status: 'running' | 'idle' | 'offline';
	hasWork: boolean;
	unreadMail: number;
	rig?: string;
	currentTask?: string;
}

/**
 * Check if an agent description indicates work is done/completed
 * e.g. "nitro: done", "task-42: done"
 */
function isWorkDone(description: string): boolean {
	const lower = description.toLowerCase();
	return lower.endsWith(': done') || lower === 'done';
}

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();

	try {
		// Read rig names from disk
		let rigNames: string[] = [];
		try {
			rigNames = await getRigNames();
		} catch {
			return json({
				agents: [],
				total: 0,
				timestamp: new Date().toISOString(),
				requestId
			});
		}

		const supervisor = getProcessSupervisor();
		const agents: Agent[] = [];

		for (const rigName of rigNames) {
			try {
				const result = await supervisor.gt(['rig', 'status', rigName], {
					timeout: 10_000
				});

				if (result.success && result.data) {
					const text = typeof result.data === 'string'
						? result.data
						: String(result.data);
					const parsed = parseRigStatusOutput(text);

					// Add witness agent
					agents.push({
						id: `${rigName}-witness`,
						name: 'witness',
						address: `${rigName}/witness`,
						role: 'witness',
						status: parsed.witnessRunning ? 'running' : 'offline',
						hasWork: false,
						unreadMail: 0,
						rig: rigName
					});

					// Add refinery agent
					agents.push({
						id: `${rigName}-refinery`,
						name: 'refinery',
						address: `${rigName}/refinery`,
						role: 'refinery',
						status: parsed.refineryRunning ? 'running' : 'offline',
						hasWork: false,
						unreadMail: 0,
						rig: rigName
					});

					// Add polecat agents
					for (let i = 0; i < parsed.polecatCount; i++) {
						const entry = parsed.polecats[i];
						const agentStatus = entry?.status ?? 'running';
						const done = entry?.description ? isWorkDone(entry.description) : false;
						const hasWork = agentStatus === 'running' && !done;
						agents.push({
							id: `${rigName}-polecat-${i}`,
							name: `polecat-${i}`,
							address: `${rigName}/polecat/${i}`,
							role: 'polecat',
							status: agentStatus,
							hasWork,
							unreadMail: 0,
							rig: rigName,
							currentTask: entry?.description || undefined
						});
					}

					// Add crew agents
					for (let i = 0; i < parsed.crewCount; i++) {
						const entry = parsed.crews[i];
						const agentStatus = entry?.status ?? 'idle';
						const done = entry?.description ? isWorkDone(entry.description) : false;
						const hasWork = agentStatus === 'running' && !done;
						agents.push({
							id: `${rigName}-crew-${i}`,
							name: `crew-${i}`,
							address: `${rigName}/crew/${i}`,
							role: 'crew',
							status: agentStatus,
							hasWork,
							unreadMail: 0,
							rig: rigName,
							currentTask: entry?.description || undefined
						});
					}
				}
			} catch {
				// Rig status unavailable — skip
			}
		}

		return json({
			agents,
			total: agents.length,
			timestamp: new Date().toISOString(),
			requestId
		});
	} catch (err) {
		return json({
			agents: [],
			total: 0,
			timestamp: new Date().toISOString(),
			requestId,
			warning: err instanceof Error ? err.message : 'Unknown error'
		});
	}
};
