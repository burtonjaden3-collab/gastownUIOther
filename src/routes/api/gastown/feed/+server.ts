/**
 * Feed API endpoint - GET /api/gastown/feed
 * Returns activity feed events from gt feed command
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { getProcessSupervisor } from '$lib/server/cli';

export const GET: RequestHandler = async ({ url }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const since = url.searchParams.get('since') || '1h';
	const type = url.searchParams.get('type');

	try {
		const args = ['feed', '--plain', '--since', since];
		const result = await supervisor.gt(args, { timeout: 15_000 });

		if (!result.success) {
			return json(
				{ items: [], total: 0, requestId, error: result.error, stale: true },
				{ status: 503 }
			);
		}

		const text = typeof result.data === 'string' ? result.data : String(result.data);
		const lines = text.split('\n').filter(Boolean);
		const items = lines.map((line, i) => {
			// Parse: [timestamp] [type] [actor]: [message]
			const match = line.match(/^\[?(\S+)\]?\s+\[?(\S+)\]?\s+\[?(\S+?)\]?:\s+(.+)$/);
			if (match) {
				return {
					id: `feed-${i}-${Date.now()}`,
					timestamp: match[1],
					type: match[2].toLowerCase(),
					source: '',
					actor: match[3],
					message: match[4],
					visibility: 'public'
				};
			}
			return {
				id: `feed-${i}-${Date.now()}`,
				timestamp: new Date().toISOString(),
				type: 'info',
				source: '',
				actor: 'system',
				message: line,
				visibility: 'public'
			};
		});

		const filtered = type ? items.filter((e) => e.type === type) : items;

		return json({ items: filtered, total: filtered.length, requestId });
	} catch (err) {
		return json({
			items: [],
			total: 0,
			requestId,
			warning: err instanceof Error ? err.message : 'Unknown error'
		});
	}
};
