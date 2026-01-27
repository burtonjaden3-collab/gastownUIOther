import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	try {
		const result = await supervisor.bd(['gate', 'list', '--json'], { timeout: 15_000 });
		if (!result.success) {
			return json({ items: [], total: 0, requestId, error: result.error, stale: true }, { status: 503 });
		}
		const items = Array.isArray(result.data) ? result.data : [];
		return json({ items, total: items.length, requestId, duration: result.duration });
	} catch (err) {
		return json({ items: [], total: 0, requestId, warning: err instanceof Error ? err.message : 'Unknown error' });
	}
};
