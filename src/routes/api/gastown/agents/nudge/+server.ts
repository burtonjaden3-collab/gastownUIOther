import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ request }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();

	try {
		const body = await request.json();
		const { agent, message } = body as { agent: string; message: string };

		if (!agent || !message) {
			return validationError('Agent and message are required', requestId);
		}

		const result = await supervisor.gt(['nudge', agent, message], { timeout: 30_000 });
		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to nudge agent'), requestId);
		}
		return json({ success: true, message: `Nudged ${agent}`, requestId });
	} catch (err) {
		return serverError(err, requestId);
	}
};
