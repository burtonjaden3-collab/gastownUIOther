/**
 * GET /api/gastown/status
 *
 * Returns system status by reading on-disk config + per-rig CLI status.
 * Includes per-rig agent data so the rigs store can build its tree.
 * Does NOT use `gt status --json` which hangs indefinitely.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getProcessSupervisor,
	getRegisteredRigs,
	getDaemonConfig,
	getTownConfig,
	parseRigStatusOutput
} from '$lib/server/cli';

interface RigAgent {
	id: string;
	name: string;
	address: string;
	role: string;
	status: 'running' | 'idle' | 'offline';
	hasWork: boolean;
	unreadMail: number;
}

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();

	try {
		const [rigs, daemonConfig, townConfig] = await Promise.all([
			getRegisteredRigs().catch(() => []),
			getDaemonConfig(),
			getTownConfig()
		]);

		const supervisor = getProcessSupervisor();
		const rigStatuses = [];

		for (const rig of rigs) {
			try {
				const result = await supervisor.gt(['rig', 'status', rig.name], {
					timeout: 10_000
				});

				if (result.success && result.data) {
					const text = typeof result.data === 'string'
						? result.data
						: String(result.data);
					const parsed = parseRigStatusOutput(text);

					// Synthesize agents from parsed rig status
					const agents: RigAgent[] = [];

					agents.push({
						id: `${rig.name}-witness`,
						name: 'witness',
						address: `${rig.name}/witness`,
						role: 'witness',
						status: parsed.witnessRunning ? 'running' : 'offline',
						hasWork: false,
						unreadMail: 0
					});

					agents.push({
						id: `${rig.name}-refinery`,
						name: 'refinery',
						address: `${rig.name}/refinery`,
						role: 'refinery',
						status: parsed.refineryRunning ? 'running' : 'offline',
						hasWork: false,
						unreadMail: 0
					});

					// Add polecat stubs
					for (let i = 0; i < parsed.polecatCount; i++) {
						agents.push({
							id: `${rig.name}-polecat-${i}`,
							name: `polecat-${i}`,
							address: `${rig.name}/polecat/${i}`,
							role: 'polecat',
							status: 'running',
							hasWork: false,
							unreadMail: 0
						});
					}

					// Add crew stubs
					for (let i = 0; i < parsed.crewCount; i++) {
						agents.push({
							id: `${rig.name}-crew-${i}`,
							name: `crew-${i}`,
							address: `${rig.name}/crew/${i}`,
							role: 'crew',
							status: 'idle',
							hasWork: false,
							unreadMail: 0
						});
					}

					rigStatuses.push({
						name: rig.name,
						status: parsed.status,
						witnessRunning: parsed.witnessRunning,
						refineryRunning: parsed.refineryRunning,
						polecatCount: parsed.polecatCount,
						crewCount: parsed.crewCount,
						agents
					});
				} else {
					rigStatuses.push({
						name: rig.name,
						status: 'unknown',
						witnessRunning: false,
						refineryRunning: false,
						polecatCount: 0,
						crewCount: 0,
						agents: []
					});
				}
			} catch {
				rigStatuses.push({
					name: rig.name,
					status: 'error',
					witnessRunning: false,
					refineryRunning: false,
					polecatCount: 0,
					crewCount: 0,
					agents: []
				});
			}
		}

		return json({
			data: {
				name: townConfig?.name || 'unknown',
				rigs: rigStatuses,
				daemon: daemonConfig
					? {
							heartbeat: daemonConfig.heartbeat,
							patrols: daemonConfig.patrols
						}
					: null
			},
			timestamp: new Date().toISOString(),
			requestId
		});
	} catch (err) {
		return json(
			{
				error: err instanceof Error ? err.message : 'Unknown error',
				code: 'SERVER_ERROR',
				requestId
			},
			{ status: 500 }
		);
	}
};
