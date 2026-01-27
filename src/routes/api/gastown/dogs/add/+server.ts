import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ request }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();

	try {
		const body = await request.json();
		const { name } = body as { name: string };

		if (!name) {
			return validationError('Dog name is required', requestId);
		}

		const result = await supervisor.gt(['dog', 'add', name], { timeout: 30_000 });
		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to add dog'), requestId);
		}
		return json({ success: true, message: `Dog "${name}" added`, requestId });
	} catch (err) {
		return serverError(err, requestId);
	}
};
