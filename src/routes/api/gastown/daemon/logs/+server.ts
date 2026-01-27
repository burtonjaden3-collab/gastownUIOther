import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

export const GET: RequestHandler = async ({ url }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	const rawLimit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
	const limit = Math.min(Math.max(1, rawLimit || DEFAULT_LIMIT), MAX_LIMIT);

	try {
		const result = await supervisor.gt(['daemon', 'logs'], { timeout: 10_000 });
		if (!result.success) {
			return json({ items: [], total: 0, requestId, error: result.error }, { status: 503 });
		}

		const text = typeof result.data === 'string' ? result.data : String(result.data);
		const lines = text.split('\n').filter(Boolean);
		const allItems = lines.map(line => {
			const match = line.match(/^\[?(\S+\s?\S*)\]?\s*\[?(\w+)\]?\s*(.+)/);
			if (match) {
				return { timestamp: match[1], level: match[2].toLowerCase(), message: match[3] };
			}
			return { timestamp: new Date().toISOString(), level: 'info', message: line };
		});

		const total = allItems.length;
		const items = allItems.slice(-limit);

		return json({ items, total, requestId });
	} catch (err) {
		return json({ items: [], total: 0, requestId, warning: err instanceof Error ? err.message : 'Unknown error' });
	}
};
