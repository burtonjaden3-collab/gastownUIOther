import { json } from '@sveltejs/kit';
import crypto from 'node:crypto';

export interface StandardErrorBody {
	error: string;
	code: string;
	requestId: string;
}

export interface StandardSuccessBody<T = unknown> {
	data: T;
	requestId: string;
	timestamp: string;
}

export function createRequestId(): string {
	return crypto.randomUUID().slice(0, 8);
}

export function errorResponse(
	message: string,
	opts: { status?: number; code?: string; requestId?: string } = {}
): Response {
	const { status = 500, code = 'INTERNAL_ERROR', requestId = createRequestId() } = opts;
	const body: StandardErrorBody = { error: message, code, requestId };
	return json(body, { status });
}

export function validationError(message: string, requestId?: string): Response {
	return errorResponse(message, { status: 400, code: 'VALIDATION_ERROR', requestId });
}

export function serverError(err: unknown, requestId?: string): Response {
	const message = err instanceof Error ? err.message : 'Internal server error';
	return errorResponse(message, { status: 500, code: 'SERVER_ERROR', requestId });
}

/**
 * Shared handler for simple gt CLI actions that take a name param and run a command.
 * Covers the common pattern: validate name → run gt [resource, action, name] → return result.
 */
export async function handleGtAction(
	params: { name?: string },
	command: [resource: string, action: string],
	opts?: { pastTense?: string; timeout?: number }
): Promise<Response> {
	const { getProcessSupervisor, validateNameParam } = await import('$lib/server/cli');
	const requestId = createRequestId();
	const { name } = params;
	const nameError = validateNameParam(name);
	if (nameError || !name) {
		return validationError(nameError ?? 'Missing name parameter', requestId);
	}

	const [resource, action] = command;
	const pastTense = opts?.pastTense ?? `${action}ed`;

	try {
		const supervisor = getProcessSupervisor();
		const result = await supervisor.gt([resource, action, name], {
			timeout: opts?.timeout ?? 30_000
		});

		if (!result.success) {
			return serverError(
				new Error(result.error || `Failed to ${action} ${resource}`),
				requestId
			);
		}

		return json({
			success: true,
			message: `${resource.charAt(0).toUpperCase() + resource.slice(1)} ${name} ${pastTense}`,
			requestId
		});
	} catch (err) {
		return serverError(err, requestId);
	}
}
