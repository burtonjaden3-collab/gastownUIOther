import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, getPollGate } from '$lib/server/cli';
import { createRequestId, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async () => {
	const requestId = createRequestId();
	const supervisor = getProcessSupervisor();
	const gate = getPollGate();

	// Pause polling while daemon starts. The 35s safety net auto-resumes
	// if something goes wrong and we never call resume() explicitly.
	gate.pause(35_000);

	try {
		const result = await supervisor.gt(['up'], { timeout: 30_000 });
		if (!result.success) {
			gate.resume();
			return serverError(new Error(result.error || 'Failed to start services'), requestId);
		}
		// gt up succeeded — give rigs 5s to initialize before polling resumes.
		// pause() resets the safety timer so we get a clean 5s window.
		gate.pause(5_000);
		return json({ success: true, message: 'Services started', requestId });
	} catch (err) {
		gate.resume();
		return serverError(err, requestId);
	}
};
