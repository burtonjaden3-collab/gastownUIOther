import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();
	const { id } = params;

	try {
		const result = await supervisor.gt(['convoy', 'close', id], { timeout: 30_000 });
		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to close convoy'), requestId);
		}
		return json({ success: true, message: `Convoy ${id} closed`, requestId });
	} catch (err) {
		return serverError(err, requestId);
	}
};
