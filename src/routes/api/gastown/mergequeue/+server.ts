import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, getRigNames } from '$lib/server/cli';

export const GET: RequestHandler = async () => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();

	try {
		const rigNames = await getRigNames();
		if (rigNames.length === 0) {
			return json({ items: [], total: 0, requestId });
		}

		const allItems: Record<string, unknown>[] = [];

		for (const rig of rigNames) {
			const result = await supervisor.gt(['mq', 'list', rig, '--json'], { timeout: 30_000 });
			if (result.success) {
				// JSON mode returns null for an empty queue
				const rigItems = Array.isArray(result.data) ? result.data : [];
				for (const item of rigItems) {
					allItems.push({ ...(item as Record<string, unknown>), rig });
				}
				continue;
			}

			// Fallback: parse text output from `gt mq list <rig>`
			const textResult = await supervisor.gt(['mq', 'list', rig], { timeout: 30_000 });
			if (textResult.success && textResult.data) {
				const text = typeof textResult.data === 'string' ? textResult.data : String(textResult.data);
				const lines = text.split('\n').filter(Boolean);
				// Skip header/summary lines and "(empty)" markers
				const dataLines = lines.filter(l => {
					const t = l.trim();
					return t
						&& !t.startsWith('📋')
						&& t !== '(empty)'
						&& !t.startsWith('ID');
				});
				for (const [i, line] of dataLines.entries()) {
					const parts = line.trim().split(/\s{2,}/);
					allItems.push({
						id: parts[0] || `mq-${rig}-${i}`,
						status: (parts[1] || 'queued').toLowerCase(),
						branch: parts[3] || line.trim(),
						author: parts[4] || '',
						rig,
						title: parts[3] || line.trim(),
						submittedAt: new Date().toISOString()
					});
				}
			}
		}

		return json({ items: allItems, total: allItems.length, requestId });
	} catch (err) {
		return json({ items: [], total: 0, requestId, warning: err instanceof Error ? err.message : 'Unknown error' });
	}
};
