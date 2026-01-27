import { destroyProcessSupervisor } from '$lib/server/cli/process-supervisor';

function cleanup() {
	console.log('[Hooks] Shutting down, cleaning up process supervisor...');
	destroyProcessSupervisor();
}

process.on('SIGTERM', () => {
	cleanup();
	process.exit(0);
});

process.on('SIGINT', () => {
	cleanup();
	process.exit(0);
});
