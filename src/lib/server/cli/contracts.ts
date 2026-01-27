/**
 * CLI Contracts - Type-safe definitions for Gas Town CLI commands
 * Simplified from gastown_ui/refinery/rig for MVP
 */

import { z } from 'zod';

export type CLICommand = 'gt' | 'bd';

export interface CLIResult<T = unknown> {
	success: boolean;
	data: T | null;
	error: string | null;
	exitCode: number;
	duration: number;
	command: string;
}

export interface CLICommandConfig {
	command: CLICommand;
	args: string[];
	timeout?: number;
	cwd?: string;
	dedupe?: boolean;
}

export interface ProcessSupervisorConfig {
	defaultTimeout: number;
	maxConcurrency: number;
	maxQueueSize: number;
	circuitBreakerThreshold: number;
	circuitBreakerResetTime: number;
}

export const DEFAULT_CONFIG: ProcessSupervisorConfig = {
	defaultTimeout: 30_000,
	maxConcurrency: 10,
	maxQueueSize: 50,
	circuitBreakerThreshold: 5,
	circuitBreakerResetTime: 60_000
};

export interface QueuedRequest {
	id: string;
	config: CLICommandConfig;
	resolve: (result: CLIResult) => void;
	reject: (error: Error) => void;
	enqueuedAt: number;
}

// =============================================================================
// CLI Output Schemas (Zod)
// =============================================================================

/**
 * Agent summary in status response
 */
export const GtAgentSummarySchema = z
	.object({
		name: z.string(),
		address: z.string(),
		session: z.string(),
		role: z.string(),
		running: z.boolean(),
		has_work: z.boolean(),
		state: z.string().optional(),
		unread_mail: z.number().int().min(0),
		first_subject: z.string().optional()
	})
	.passthrough();

export type GtAgentSummary = z.infer<typeof GtAgentSummarySchema>;

/**
 * Hook information for a rig
 */
export const GtHookInfoSchema = z
	.object({
		agent: z.string(),
		role: z.string(),
		has_work: z.boolean()
	})
	.passthrough();

export type GtHookInfo = z.infer<typeof GtHookInfoSchema>;

/**
 * Rig info with agents and hooks
 */
export const GtRigInfoSchema = z
	.object({
		name: z.string(),
		polecats: z.array(z.string()),
		polecat_count: z.number().int().min(0),
		crews: z.array(z.string()).nullable(),
		crew_count: z.number().int().min(0),
		has_witness: z.boolean(),
		has_refinery: z.boolean(),
		hooks: z.array(GtHookInfoSchema),
		agents: z.array(GtAgentSummarySchema)
	})
	.passthrough();

export type GtRigInfo = z.infer<typeof GtRigInfoSchema>;

/**
 * Overseer (human user) information
 */
export const GtOverseerSchema = z
	.object({
		name: z.string(),
		email: z.string(),
		username: z.string(),
		source: z.string(),
		unread_mail: z.number().int().min(0)
	})
	.passthrough();

export type GtOverseer = z.infer<typeof GtOverseerSchema>;

/**
 * Summary statistics
 */
export const GtStatusSummarySchema = z
	.object({
		rig_count: z.number().int().min(0),
		polecat_count: z.number().int().min(0),
		crew_count: z.number().int().min(0),
		witness_count: z.number().int().min(0),
		refinery_count: z.number().int().min(0),
		active_agents: z.number().int().min(0)
	})
	.passthrough();

export type GtStatusSummary = z.infer<typeof GtStatusSummarySchema>;

/**
 * Overall Gas Town status response from `gt status --json`
 */
export const GtStatusSchema = z
	.object({
		name: z.string(),
		location: z.string(),
		overseer: GtOverseerSchema,
		agents: z.array(GtAgentSummarySchema),
		rigs: z.array(GtRigInfoSchema),
		summary: GtStatusSummarySchema.optional()
	})
	.passthrough();

export type GtStatus = z.infer<typeof GtStatusSchema>;

/**
 * Bead (work item) storage status
 */
export const BdBeadStorageStatusSchema = z.enum(['open', 'closed']);

export type BdBeadStorageStatus = z.infer<typeof BdBeadStorageStatusSchema>;

/**
 * Bead (work item) from `bd list --json`
 */
export const BdBeadSchema = z
	.object({
		id: z.string(),
		title: z.string(),
		description: z.string(),
		status: BdBeadStorageStatusSchema,
		priority: z.number().int().min(0).max(4),
		issue_type: z.string(),
		assignee: z.string().nullable().optional(),
		created_at: z.string(),
		created_by: z.string(),
		updated_at: z.string(),
		labels: z.array(z.string()),
		ephemeral: z.boolean(),
		parent_id: z.string().nullable().optional(),
		children: z.array(z.string()).optional(),
		hook_bead: z.boolean().optional(),
		blocked_by_count: z.number().int().min(0).optional()
	})
	.passthrough();

export type BdBead = z.infer<typeof BdBeadSchema>;

// =============================================================================
// Input Validation
// =============================================================================

/** Pattern for valid rig, crew, agent, and polecat names */
const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/**
 * Validate a name parameter from URL params (rig, crew, agent, polecat names).
 * Returns null if valid, or an error message string if invalid.
 */
export function validateNameParam(name: string | undefined): string | null {
	if (!name) return 'Name is required';
	if (name.length > 128) return 'Name too long';
	if (!NAME_PATTERN.test(name)) return 'Invalid name format';
	return null;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Safely parse CLI JSON output with schema validation
 */
export function parseCliOutput<T>(
	schema: z.ZodSchema<T>,
	jsonString: string
): { success: true; data: T } | { success: false; error: string } {
	try {
		const parsed = JSON.parse(jsonString);
		const result = schema.safeParse(parsed);
		if (result.success) {
			return { success: true, data: result.data };
		}
		const errorMessages = result.error.issues
			.map((e) => `${e.path.join('.')}: ${e.message}`)
			.join('; ');
		return { success: false, error: `Validation failed: ${errorMessages}` };
	} catch (e) {
		return {
			success: false,
			error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}`
		};
	}
}
