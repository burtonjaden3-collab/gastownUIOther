/**
 * GET /api/gastown/convoys
 * Returns convoy items from `bd list --type=convoy --json`
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { getProcessSupervisor, type BdBead } from '$lib/server/cli';

export interface ConvoyItem {
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
}

function deriveDisplayStatus(bead: BdBead): ConvoyItem['displayStatus'] {
	if (bead.status === 'closed') return 'completed';
	if (bead.blocked_by_count && bead.blocked_by_count > 0) return 'blocked';
	if (bead.hook_bead || bead.assignee) return 'in_progress';
	return 'pending';
}

function transformConvoy(bead: BdBead): ConvoyItem {
	// Parse tracked count from description or children
	const trackedCount = bead.children?.length ?? 0;
	return {
		id: bead.id,
		title: bead.title,
		description: bead.description,
		status: bead.status as 'open' | 'closed',
		displayStatus: deriveDisplayStatus(bead),
		priority: bead.priority,
		assignee: bead.assignee || null,
		trackedCount,
		createdAt: bead.created_at,
		updatedAt: bead.updated_at,
		labels: bead.labels
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	const status = url.searchParams.get('status');

	try {
		const args = ['list', '--type=convoy', '--json'];

		const result = await supervisor.bd<BdBead[]>(args, { timeout: 30_000 });

		if (!result.success) {
			return json({
				items: [],
				total: 0,
				timestamp: new Date().toISOString(),
				requestId,
				error: result.error || 'CLI unavailable',
				stale: true
			}, { status: 503 });
		}

		let items = (result.data || []).map(transformConvoy);

		if (status) {
			items = items.filter((item) => item.displayStatus === status);
		}

		return json({
			items,
			total: items.length,
			timestamp: new Date().toISOString(),
			requestId,
			duration: result.duration
		});
	} catch (err) {
		return json({
			items: [],
			total: 0,
			timestamp: new Date().toISOString(),
			requestId,
			warning: err instanceof Error ? err.message : 'Unknown error'
		});
	}
};
