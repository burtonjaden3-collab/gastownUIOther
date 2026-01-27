import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	try {
		const result = await supervisor.gt(['dog', 'list', '--json'], { timeout: 15_000 });
		if (result.success) {
			const items = Array.isArray(result.data) ? result.data : [];
			return json({ items, total: items.length, requestId, duration: result.duration });
		}

		// Fallback to text parse
		const textResult = await supervisor.gt(['dog', 'status'], { timeout: 15_000 });
		if (textResult.success && textResult.data) {
			const text = typeof textResult.data === 'string' ? textResult.data : String(textResult.data);
			const lines = text.split('\n').filter(Boolean);
			const items = lines.map(line => {
				const match = line.match(/(\w+)\s*[:\-]\s*(idle|working|stuck)/i);
				if (match) {
					return { name: match[1].toLowerCase(), status: match[2].toLowerCase() };
				}
				return null;
			}).filter(Boolean);
			return json({ items, total: items.length, requestId });
		}

		return json({ items: [], total: 0, requestId, error: result.error, stale: true }, { status: 503 });
	} catch (err) {
		return json({ items: [], total: 0, requestId, warning: err instanceof Error ? err.message : 'Unknown error' });
	}
};
