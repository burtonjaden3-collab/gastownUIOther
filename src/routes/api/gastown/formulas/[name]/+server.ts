import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';

export const GET: RequestHandler = async ({ params }) => {
	const requestId = crypto.randomUUID();
	const supervisor = getProcessSupervisor();
	const { name } = params;

	try {
		const result = await supervisor.gt(['formula', 'show', name, '--json'], { timeout: 15_000 });
		if (!result.success) {
			return json({ data: null, requestId, error: result.error }, { status: 503 });
		}
		return json({ data: result.data, requestId, duration: result.duration });
	} catch (err) {
		return json({ data: null, requestId, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
	}
};
