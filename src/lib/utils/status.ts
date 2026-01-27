/**
 * Shared status color and variant mappings for rigs and agents.
 */

/** Dot color classes for rig status indicators */
export const RIG_STATUS_COLORS: Record<string, string> = {
	active: 'bg-green-500',
	parked: 'bg-warning-500',
	docked: 'bg-neutral-500',
	error: 'bg-red-500'
};

/** Badge variants for rig status */
export const RIG_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'chrome' | 'danger'> = {
	active: 'success',
	parked: 'warning',
	docked: 'chrome',
	error: 'danger'
};

/** Dot color classes for agent status indicators */
export const AGENT_STATUS_COLORS: Record<string, string> = {
	running: 'bg-warning-500',
	idle: 'bg-green-500',
	offline: 'bg-neutral-500'
};

/** Badge variants for agent status */
export const AGENT_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'chrome'> = {
	running: 'warning',
	idle: 'success',
	offline: 'chrome'
};

/** Display labels for agent status */
export const AGENT_STATUS_LABELS: Record<string, string> = {
	running: 'BUSY',
	idle: 'IDLE',
	offline: 'OFFLINE'
};

/** Badge variants for crew status (running = success, unlike agent) */
export const CREW_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'chrome'> = {
	running: 'success',
	idle: 'chrome',
	offline: 'chrome'
};
