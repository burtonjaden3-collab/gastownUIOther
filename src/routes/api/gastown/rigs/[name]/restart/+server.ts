import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, validateNameParam } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ params }) => {
	const requestId = createRequestId();
	const { name } = params;
	const nameError = validateNameParam(name);
	if (nameError) {
		return validationError(nameError, requestId);
	}

	const supervisor = getProcessSupervisor();

	try {
		// Stop the rig first
		const stopResult = await supervisor.gt(['rig', 'stop', name], { timeout: 30_000 });

		if (!stopResult.success) {
			return serverError(new Error(stopResult.error || 'Failed to stop rig for restart'), requestId);
		}

		// Then start it again
		const startResult = await supervisor.gt(['rig', 'start', name], { timeout: 30_000 });

		if (!startResult.success) {
			return serverError(new Error(startResult.error || 'Failed to start rig after stop'), requestId);
		}

		return json({
			success: true,
			message: `Rig ${name} restarted`,
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
};
