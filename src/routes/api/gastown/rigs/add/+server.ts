import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProcessSupervisor } from '$lib/server/cli';
import { createRequestId, validationError, serverError } from '$lib/server/api-response';

const NAME_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_NAME_LEN = 64;
const MAX_URL_LEN = 512;
const MAX_BRANCH_LEN = 128;
const MAX_PREFIX_LEN = 256;

export const POST: RequestHandler = async ({ request }) => {
	const requestId = createRequestId();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return validationError('Invalid JSON body', requestId);
	}

	const { name, gitUrl, branch, prefix } = body as {
		name?: string;
		gitUrl?: string;
		branch?: string;
		prefix?: string;
	};

	if (!name || typeof name !== 'string' || !name.trim()) {
		return validationError('Rig name is required', requestId);
	}
	if (name.length > MAX_NAME_LEN || !NAME_RE.test(name)) {
		return validationError(
			'Rig name must be 1-64 alphanumeric characters, hyphens, or underscores',
			requestId
		);
	}

	if (!gitUrl || typeof gitUrl !== 'string' || !gitUrl.trim()) {
		return validationError('Git URL is required', requestId);
	}
	if (gitUrl.length > MAX_URL_LEN) {
		return validationError(`Git URL too long (max ${MAX_URL_LEN} chars)`, requestId);
	}

	if (branch !== undefined) {
		if (typeof branch !== 'string' || branch.length > MAX_BRANCH_LEN) {
			return validationError(`Branch must be a string up to ${MAX_BRANCH_LEN} chars`, requestId);
		}
	}

	if (prefix !== undefined) {
		if (typeof prefix !== 'string' || prefix.length > MAX_PREFIX_LEN) {
			return validationError(`Prefix must be a string up to ${MAX_PREFIX_LEN} chars`, requestId);
		}
	}

	const args: string[] = ['rig', 'add', name.trim(), gitUrl.trim()];
	if (branch?.trim()) {
		args.push('--branch', branch.trim());
	}
	if (prefix?.trim()) {
		args.push('--prefix', prefix.trim());
	}

	try {
		const supervisor = getProcessSupervisor();
		const result = await supervisor.gt(args, { timeout: 30_000 });

		if (!result.success) {
			return serverError(new Error(result.error || 'Failed to add rig'), requestId);
		}

		return json({
			success: true,
			message: `Rig "${name.trim()}" added`,
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
};
