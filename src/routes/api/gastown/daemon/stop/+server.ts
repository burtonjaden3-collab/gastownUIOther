import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, getPollGate } from '$lib/server/cli';
import { createRequestId, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async () => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();
	const gate = getPollGate();

	gate.pause(35_000);

	try {
		const result = await supervisor.gt(['down'], { timeout: 30_000 });
		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to stop services'), requestId);
		}
		return json({ success: true, message: 'Services stopped', requestId });
	} catch (err) {
		return serverError(err, requestId);
	} finally {
		setTimeout(() => gate.resume(), 3_000);
	}
};
