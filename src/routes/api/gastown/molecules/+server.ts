import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	try {
		const result = await supervisor.gt(['mol', 'status', '--json'], { timeout: 30_000 });
		if (!result.success) {
			const errorMsg = result.error ?? '';
			if (errorMsg.toLowerCase().includes('no beads database found')) {
				return json({ items: [], total: 0, requestId, duration: result.duration });
			}
			return json({ items: [], total: 0, requestId, error: result.error, stale: true }, { status: 503 });
		}
		const data = result.data;
		const items = Array.isArray(data) ? data : data ? [data] : [];
		return json({ items, total: items.length, requestId, duration: result.duration });
	} catch (err) {
		return json({ items: [], total: 0, requestId, warning: err instanceof Error ? err.message : 'Unknown error' });
	}
};
