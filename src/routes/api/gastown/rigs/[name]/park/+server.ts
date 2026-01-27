import type { RequestHandler } from './$types';
import { handleGtAction } from '$lib/server/api-response';

export const POST: RequestHandler = async ({ params }) =>
	handleGtAction(params, ['rig', 'park'], { pastTense: 'parked' });
