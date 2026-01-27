import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const GET: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { id } = params;

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
				...data,
				blocks,
				blockedBy,
				dependencies
			},
			requestId,
			duration: result.duration
		});
	} catch (err) {
		return json({ data: null, requestId, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
	}
};
