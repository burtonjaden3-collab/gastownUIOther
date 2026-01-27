/**
 * Process Supervisor - Safe, observable CLI execution
 *
 * Features:
 * - Uses execFile (no shell) for security
 * - Configurable timeouts per command
 * - Concurrency limiting
 * - Circuit breaker for failure protection
 * - Process tracking with cleanup on destroy
 */

import { execFile, type ChildProcess } from 'node:child_process';
import type { CLIResult, CLICommandConfig, ProcessSupervisorConfig } from './contracts';
import { DEFAULT_CONFIG } from './contracts';
import { ConcurrencyLimiter } from './concurrency-limiter';
import { CircuitBreaker } from './circuit-breaker';

/**
 * Build the PATH environment variable that includes gt and bd CLI locations.
 */
function getEnvWithPath(): NodeJS.ProcessEnv {
	const homedir = process.env.HOME || '';
	const additionalPaths = [
		`${homedir}/.local/bin`, // bd default install location
		`${homedir}/go/bin` // gt default install location (go install)
	];
	const currentPath = process.env.PATH || '';
	const newPath = [...additionalPaths, currentPath].join(':');

	return {
		...process.env,
		PATH: newPath
	};
}

/**
 * Get the town directory from GT_TOWN environment variable.
 */
function getTownCwd(): string | undefined {
	return process.env.GT_TOWN || undefined;
}

export class ProcessSupervisor {
	private readonly config: ProcessSupervisorConfig;
	private readonly limiter: ConcurrencyLimiter;
	private readonly breakers: Map<string, CircuitBreaker> = new Map();
	private readonly activeProcesses: Map<string, ChildProcess> = new Map();
	private totalSpawned = 0;
	private destroyed = false;

	constructor(config: Partial<ProcessSupervisorConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.limiter = new ConcurrencyLimiter(this.config.maxConcurrency, this.config.maxQueueSize);
	}

	private getDomainKey(config: CLICommandConfig): string {
		return `${config.command}-${config.args[0] || 'default'}`;
	}

	private getBreaker(domain: string): CircuitBreaker {
		let breaker = this.breakers.get(domain);
		if (!breaker) {
			breaker = new CircuitBreaker(
				this.config.circuitBreakerThreshold,
				this.config.circuitBreakerResetTime
			);
			this.breakers.set(domain, breaker);
		}
		return breaker;
	}

	async execute<T = unknown>(commandConfig: CLICommandConfig): Promise<CLIResult<T>> {
		if (this.destroyed) {
			return {
				success: false,
				data: null,
				error: 'Process supervisor has been destroyed',
				exitCode: -1,
				duration: 0,
				command: this.formatCommand(commandConfig)
			};
		}

		const domain = this.getDomainKey(commandConfig);
		const breaker = this.getBreaker(domain);

		if (!breaker.canExecute()) {
			return {
				success: false,
				data: null,
				error: `Circuit breaker is open for domain ${domain} - CLI is unavailable`,
				exitCode: -1,
				duration: 0,
				command: this.formatCommand(commandConfig)
			};
		}

		return this.limiter.execute(commandConfig, (cfg) =>
			this.executeCommand<T>(cfg, breaker)
		) as Promise<CLIResult<T>>;
	}

	private executeCommand<T>(config: CLICommandConfig, breaker: CircuitBreaker): Promise<CLIResult<T>> {
		return new Promise((resolve) => {
			const startTime = Date.now();
			const timeout = config.timeout ?? this.config.defaultTimeout;
			const command = this.formatCommand(config);
			const processId = crypto.randomUUID();

			this.totalSpawned++;

			const child = execFile(
				config.command,
				config.args,
				{
					timeout,
					maxBuffer: 10 * 1024 * 1024,
					cwd: config.cwd || getTownCwd(),
					env: getEnvWithPath()
				},
				(error, stdout, stderr) => {
					this.activeProcesses.delete(processId);
					const duration = Date.now() - startTime;

					if (error) {
						// When a process is killed (e.g. timeout), stdout may still
						// contain valid output. Return it even if the process failed.
						if (error.killed && stdout.trim()) {
							let data: T | null = null;
							try {
								data = JSON.parse(stdout) as T;
							} catch {
								data = stdout as unknown as T;
							}
							breaker.recordSuccess();
							resolve({
								success: true,
								data,
								error: null,
								exitCode: 0,
								duration,
								command
							});
							return;
						}

						breaker.recordFailure();

						const isTimeout = error.killed && error.message.includes('ETIMEDOUT');
						const wasKilled = error.killed;
						const errorMessage = isTimeout
							? `Command timed out after ${timeout}ms`
							: wasKilled
								? 'Process was killed'
								: stderr || error.message;

						// Preserve stdout as data even on non-zero exit —
						// commands like `gt doctor` produce useful output with exit code 1
						let errorData: T | null = null;
						if (stdout.trim()) {
							try {
								errorData = JSON.parse(stdout) as T;
							} catch {
								errorData = stdout as unknown as T;
							}
						}

						resolve({
							success: false,
							data: errorData,
							error: errorMessage,
							exitCode: typeof error.code === 'number' ? error.code : -1,
							duration,
							command
						});
						return;
					}

					breaker.recordSuccess();

					let data: T | null = null;
					try {
						data = JSON.parse(stdout) as T;
					} catch {
						data = stdout as unknown as T;
					}

					resolve({
						success: true,
						data,
						error: null,
						exitCode: 0,
						duration,
						command
					});
				}
			);

			this.activeProcesses.set(processId, child);

			child.on('error', (err) => {
				this.activeProcesses.delete(processId);
				breaker.recordFailure();
				resolve({
					success: false,
					data: null,
					error: `Failed to spawn process: ${err.message}`,
					exitCode: -1,
					duration: Date.now() - startTime,
					command
				});
			});
		});
	}

	private formatCommand(config: CLICommandConfig): string {
		return `${config.command} ${config.args.join(' ')}`;
	}

	gt<T = unknown>(args: string[], options: Partial<CLICommandConfig> = {}): Promise<CLIResult<T>> {
		return this.execute<T>({
			command: 'gt',
			args,
			...options
		});
	}

	bd<T = unknown>(args: string[], options: Partial<CLICommandConfig> = {}): Promise<CLIResult<T>> {
		return this.execute<T>({
			command: 'bd',
			args,
			...options
		});
	}

	getStats(): {
		queue: { queued: number; active: number; maxConcurrency: number };
		circuitBreaker: Record<string, ReturnType<CircuitBreaker['getStats']>>;
	} {
		const breakerStats: Record<string, ReturnType<CircuitBreaker['getStats']>> = {};
		for (const [domain, breaker] of this.breakers) {
			breakerStats[domain] = breaker.getStats();
		}
		return {
			queue: this.limiter.getStats(),
			circuitBreaker: breakerStats
		};
	}

	resetCircuitBreaker(domain?: string): void {
		if (domain) {
			const breaker = this.breakers.get(domain);
			if (breaker) {
				breaker.reset();
			}
		} else {
			for (const breaker of this.breakers.values()) {
				breaker.reset();
			}
		}
	}

	getProcessStats(): { activeProcesses: number; totalSpawned: number } {
		return {
			activeProcesses: this.activeProcesses.size,
			totalSpawned: this.totalSpawned
		};
	}

	destroy(): void {
		this.destroyed = true;
		this.activeProcesses.forEach((process, id) => {
			process.kill('SIGKILL');
			this.activeProcesses.delete(id);
		});
		this.limiter.clear();
	}

	isDestroyed(): boolean {
		return this.destroyed;
	}
}

// Singleton instance
let globalSupervisor: ProcessSupervisor | null = null;

export function getProcessSupervisor(config?: Partial<ProcessSupervisorConfig>): ProcessSupervisor {
	if (!globalSupervisor) {
		globalSupervisor = new ProcessSupervisor(config);
	}
	return globalSupervisor;
}

export function resetProcessSupervisor(): void {
	globalSupervisor = null;
}

export function destroyProcessSupervisor(): void {
	if (globalSupervisor) {
		globalSupervisor.destroy();
		globalSupervisor = null;
	}
}
