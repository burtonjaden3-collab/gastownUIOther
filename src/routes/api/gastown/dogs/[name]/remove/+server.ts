import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();
	const { name } = params;

	try {
		const result = await supervisor.gt(['dog', 'remove', name], { timeout: 30_000 });
		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to remove dog'), requestId);
		}
		return json({ success: true, message: `Dog "${name}" removed`, requestId });
	} catch (err) {
		return serverError(err, requestId);
	}
};
