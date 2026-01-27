import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ request }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();

	try {
		const body = await request.json();
		const { message } = body as { message: string };

		if (!message) {
			return validationError('Message is required', requestId);
		}

		const result = await supervisor.gt(['broadcast', message], { timeout: 30_000 });
		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to broadcast'), requestId);
		}
		return json({ success: true, message: 'Broadcast sent', requestId });
	} catch (err) {
		return serverError(err, requestId);
	}
};
