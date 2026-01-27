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
		const result = await supervisor.gt(['polecat', 'nuke', name], { timeout: 30_000 });

		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to nuke polecat'), requestId);
		}

		return json({
			success: true,
			message: `Polecat ${name} nuked`,
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
};
