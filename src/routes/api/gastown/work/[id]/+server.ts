import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

/** Bead ID format: alphanumeric prefix, hyphen, 5 alphanumeric chars */
const BEAD_ID_RE = /^[a-zA-Z0-9]+-[a-zA-Z0-9]{5}$/;

export const GET: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { id } = params;

	if (!BEAD_ID_RE.test(id)) {
		return json(
			{ data: null, requestId, error: 'Invalid bead ID format' },
			{ status: 400 }
		);
	}

	try {
		const result = await supervisor.bd(['show', id, '--json'], { timeout: 15_000 });
		if (!result.success) {
			return json({ data: null, requestId, error: result.error }, { status: 503 });
		}

		const data = result.data as Record<string, unknown> | null;

		// Extract dependency info
		const blocks = (data?.blocks || data?.blocks_ids || []) as string[];
		const blockedBy = (data?.blocked_by || data?.blocked_by_ids || []) as string[];
		const dependencies = (data?.dependencies || []) as string[];

		return json({
			data: {
				id: data?.id ?? id,
				title: data?.title ?? '',
				description: data?.description ?? '',
				status: data?.status ?? 'pending',
				priority: data?.priority ?? 2,
				type: data?.issue_type ?? data?.type ?? 'task',
				assignee: data?.assignee ?? null,
				createdAt: data?.created_at ?? data?.createdAt ?? '',
				updatedAt: data?.updated_at ?? data?.updatedAt ?? '',
				labels: (data?.labels ?? []) as string[],
				children: (data?.children ?? []) as string[],
				dependsOn: dependencies,
				blocks,
				blockedBy,
				hookBead: data?.hook_bead ?? data?.hookBead ?? null,
				agentState: data?.agent_state ?? data?.agentState ?? null
			},
			requestId,
			duration: result.duration
		});
	} catch (err) {
		return json({ data: null, requestId, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
	}
};
