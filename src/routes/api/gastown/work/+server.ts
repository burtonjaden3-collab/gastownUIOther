/**
 * GET /api/gastown/work
 * Returns work items (beads) from `bd list --json`
 *
 * POST /api/gastown/work
 * Creates a new work item via `bd create`
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, type BdBead } from '$lib/server/cli';

export interface WorkItem {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'in_progress' | 'blocked' | 'completed';
	priority: number;
	type: string;
	assignee: string | null;
	createdAt: string;
	updatedAt: string;
	labels: string[];
}

/**
 * Derive display status from bead storage status and context fields
 */
function deriveDisplayStatus(bead: BdBead): WorkItem['status'] {
	if (bead.status === 'closed') return 'completed';
	if (bead.blocked_by_count && bead.blocked_by_count > 0) return 'blocked';
	if (bead.hook_bead || bead.assignee) return 'in_progress';
	return 'pending';
}

function transformBead(bead: BdBead): WorkItem {
	return {
		id: bead.id,
		title: bead.title,
		description: bead.description,
		status: deriveDisplayStatus(bead),
		priority: bead.priority,
		type: bead.issue_type,
		assignee: bead.assignee || null,
		createdAt: bead.created_at,
		updatedAt: bead.updated_at,
		labels: bead.labels
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	// Query params for filtering
	const status = url.searchParams.get('status');
	const type = url.searchParams.get('type');

	try {
		const args = ['list', '--json'];

		// Add filters if provided
		if (type) {
			args.push(`--type=${type}`);
		}

		const result = await supervisor.bd<BdBead[]>(args, { timeout: 30_000 });

		if (!result.success) {
			// Empty list is valid — "no beads" just means nothing exists yet
			if (result.error?.includes('no beads') || result.error?.includes('No beads')) {
				return json({
					items: [],
					total: 0,
					timestamp: new Date().toISOString(),
					requestId
				});
			}

			return json({
				items: [],
				total: 0,
				timestamp: new Date().toISOString(),
				requestId,
				error: result.error || 'CLI unavailable',
				stale: true
			}, { status: 503 });
		}

		let items = (result.data || []).map(transformBead);

		// Client-side filter by status if provided
		if (status) {
			items = items.filter((item) => item.status === status);
		}

		return json({
			items,
			total: items.length,
			timestamp: new Date().toISOString(),
			requestId,
			duration: result.duration
		});
	} catch (err) {
		// Return empty list on error rather than 500 — the system may simply be offline
		return json({
			items: [],
			total: 0,
			timestamp: new Date().toISOString(),
			requestId,
			warning: err instanceof Error ? err.message : 'Unknown error'
		});
	}
};

/**
 * Map UI task types to valid bd issue types.
 * bd accepts: bug|feature|task|epic|chore|merge-request|molecule|gate|agent|role|rig|convoy|event
 */
const BD_TYPE_MAP: Record<string, string> = {
	code: 'task',
	data: 'chore',
	general: 'task',
	// Pass through any valid bd types as-is
	bug: 'bug',
	feature: 'feature',
	task: 'task',
	epic: 'epic',
	chore: 'chore'
};

export const POST: RequestHandler = async ({ request }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	try {
		const body = await request.json();
		const { title, description, type = 'task', priority = 2 } = body;

		if (!title || typeof title !== 'string') {
			return json({ error: 'Title is required', requestId }, { status: 400 });
		}

		if (!description || typeof description !== 'string') {
			return json({ error: 'Description is required', requestId }, { status: 400 });
		}

		const bdType = BD_TYPE_MAP[type] || 'task';

		const args = [
			'create',
			`--title=${title}`,
			`--type=${bdType}`,
			`--priority=${priority}`,
			'--json'
		];

		// Description via stdin or arg
		if (description.length < 500) {
			args.push(`--description=${description}`);
		}

		const result = await supervisor.bd<BdBead>(args, { timeout: 30_000 });

		if (!result.success) {
			return json(
				{
					error: result.error || 'Failed to create work item',
					requestId
				},
				{ status: 500 }
			);
		}

		return json(
			{
				item: result.data ? transformBead(result.data) : null,
				message: 'Work item created',
				timestamp: new Date().toISOString(),
				requestId
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Work create error:', err);
		return json(
			{
				error: err instanceof Error ? err.message : 'Unknown error',
				requestId
			},
			{ status: 500 }
		);
	}
};
