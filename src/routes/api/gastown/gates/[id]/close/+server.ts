import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ params, request }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();
	const { id } = params;

	try {
		const body = await request.json();
		const { reason } = body as { reason: string };

		if (!reason) {
			return validationError('Reason is required', requestId);
		}

		const result = await supervisor.bd(['gate', 'close', id, '--reason', reason], { timeout: 15_000 });
		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to close gate'), requestId);
		}
		return json({ success: true, message: `Gate ${id} closed`, requestId });
	} catch (err) {
		return serverError(err, requestId);
	}
};
