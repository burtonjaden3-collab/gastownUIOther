/**
 * PollGate — pauses SSE polling during daemon start/stop
 * to avoid spawning CLI processes while the system is transitioning.
 */

const DEFAULT_AUTO_RESUME_MS = 35_000;

class PollGate {
	#paused = false;
	#timer: ReturnType<typeof setTimeout> | null = null;

	pause(durationMs = DEFAULT_AUTO_RESUME_MS): void {
		this.#paused = true;
		this.#clearTimer();
		// Safety net: auto-resume if caller forgets
		this.#timer = setTimeout(() => this.resume(), durationMs);
	}

	resume(): void {
		this.#paused = false;
		this.#clearTimer();
	}

	get isPaused(): boolean {
		return this.#paused;
	}

	#clearTimer(): void {
		if (this.#timer) {
			clearTimeout(this.#timer);
			this.#timer = null;
		}
	}
}

let instance: PollGate | null = null;

export function getPollGate(): PollGate {
	if (!instance) {
		instance = new PollGate();
	}
	return instance;
}
