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
		// The unsling command takes a bead ID, but we're unslinging by agent
		// Pass the agent name and let the CLI resolve the bead
		const result = await supervisor.gt(['unsling', '--agent', name], { timeout: 30_000 });

		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to unsling work'), requestId);
		}

		return json({
			success: true,
			message: `Work unslung from ${name}`,
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
};
