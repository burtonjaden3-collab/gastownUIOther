import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor, validateNameParam } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

const NAME_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_NAME_LEN = 64;

export const POST: RequestHandler = async ({ params, request }) => {
	const requestId = createRequestId();

	// Validate rig name from URL
	const rigName = params.name;
	const rigError = validateNameParam(rigName);
	if (rigError || !rigName) {
		return validationError(rigError ?? 'Missing rig name', requestId);
	}

	// Parse body for worker name
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return validationError('Invalid JSON body', requestId);
	}

	const { workerName } = body as { workerName?: string };

	if (!workerName || typeof workerName !== 'string' || !workerName.trim()) {
		return validationError('Worker name is required', requestId);
	}

	const trimmed = workerName.trim();
	if (trimmed.length > MAX_NAME_LEN || !NAME_RE.test(trimmed)) {
		return validationError(
			'Worker name must be 1-64 alphanumeric characters, hyphens, or underscores',
			requestId
		);
	}

	try {
		const supervisor = getProcessSupervisor();
		const result = await supervisor.gt(['crew', 'add', trimmed, '--rig', rigName], {
			timeout: 30_000
		});

		if (!result.success) {
			return serverError(
				new Error(result.error || 'Failed to add crew worker'),
				requestId
			);
		}

		return json({
			success: true,
			message: `Crew worker "${trimmed}" added to rig "${rigName}"`,
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
};
