/**
 * Task Queue Store - Svelte 5 Runes
 * Manages task submission and queue state with real API integration
 */

import { api } from '$lib/api/client';

export type TaskType = 'code' | 'data' | 'general';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'failed';
export type DetailLevel = 'minimal' | 'normal' | 'verbose';

export interface Task {
	id: string;
	title: string;
	description: string;
	type: TaskType;
	status: TaskStatus;
	priority: number;
	assignee: string | null;
	createdAt: string;
	updatedAt: string;
	labels: string[];
}

/** API response from getWork() */
export interface WorkListResponse {
	items?: Task[];
}

/** API response from createWork() */
export interface TaskDetailResponse {
	item?: Task;
}

interface TasksState {
	items: Task[];
	isLoading: boolean;
	error: string | null;
	detailLevel: DetailLevel;
	lastFetch: Date | null;
}

class TasksStore {
	#state = $state<TasksState>({
		items: [],
		isLoading: false,
		error: null,
		detailLevel: 'normal',
		lastFetch: null
	});

	get items() {
		return this.#state.items;
	}

	get isLoading() {
		return this.#state.isLoading;
	}

	get error() {
		return this.#state.error;
	}

	get detailLevel() {
		return this.#state.detailLevel;
	}

	get lastFetch() {
		return this.#state.lastFetch;
	}

	get pending() {
		return this.#state.items.filter((t) => t.status === 'pending');
	}

	get inProgress() {
		return this.#state.items.filter((t) => t.status === 'in_progress');
	}

	get completed() {
		return this.#state.items.filter((t) => t.status === 'completed');
	}

	get blocked() {
		return this.#state.items.filter((t) => t.status === 'blocked');
	}

	get stats() {
		const items = this.#state.items;
		const inProgress = items.filter((t) => t.status === 'in_progress').length;
		const blocked = items.filter((t) => t.status === 'blocked').length;
		return {
			total: items.length,
			pending: items.filter((t) => t.status === 'pending').length,
			inProgress,
			completed: items.filter((t) => t.status === 'completed').length,
			blocked,
			failed: items.filter((t) => t.status === 'failed').length,
			// Alias for component compatibility
			running: inProgress
		};
	}

	setDetailLevel(level: DetailLevel) {
		this.#state.detailLevel = level;
	}

	cycleDetailLevel() {
		const levels: DetailLevel[] = ['minimal', 'normal', 'verbose'];
		const currentIndex = levels.indexOf(this.#state.detailLevel);
		this.#state.detailLevel = levels[(currentIndex + 1) % levels.length];
	}

	/**
	 * Fetch tasks from the API
	 */
	async fetch(filters?: { status?: string; type?: string }) {
		this.#state.isLoading = true;
		this.#state.error = null;

		try {
			const response = (await api.getWork(filters)) as WorkListResponse;
			this.#state.items = response.items || [];
			this.#state.lastFetch = new Date();
		} catch (e) {
			// Preserve existing items on fetch failure — don't wipe stale data
			this.#state.error = e instanceof Error ? e.message : 'Failed to fetch tasks';
			console.error('Failed to fetch tasks:', e);
		} finally {
			this.#state.isLoading = false;
		}
	}

	/**
	 * Create a new task via API
	 */
	async createTask(task: {
		title: string;
		description: string;
		type?: string;
		priority?: number;
	}): Promise<Task | null> {
		this.#state.isLoading = true;
		this.#state.error = null;

		try {
			const response = (await api.createWork({
				title: task.title,
				description: task.description,
				type: task.type || 'task',
				priority: task.priority || 2
			})) as TaskDetailResponse;

			// Refresh the list after creating
			await this.fetch();

			return response.item || null;
		} catch (e) {
			this.#state.error = e instanceof Error ? e.message : 'Failed to create task';
			console.error('Failed to create task:', e);
			return null;
		} finally {
			this.#state.isLoading = false;
		}
	}

	getTask(id: string): Task | undefined {
		return this.#state.items.find((t) => t.id === id);
	}

	/**
	 * Legacy method for mock simulation - kept for demo mode
	 */
	addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'labels'>): Task {
		const newTask: Task = {
			...task,
			id: crypto.randomUUID(),
			status: 'pending',
			priority: 2,
			assignee: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			labels: []
		};

		this.#state.items = [newTask, ...this.#state.items];
		return newTask;
	}

	updateTask(id: string, updates: Partial<Task>) {
		this.#state.items = this.#state.items.map((task) =>
			task.id === id ? { ...task, ...updates } : task
		);
	}

	removeTask(id: string) {
		this.#state.items = this.#state.items.filter((t) => t.id !== id);
	}

	/**
	 * Replace all items (used by SSE updates)
	 */
	setItems(tasks: Task[]) {
		this.#state.items = tasks;
		this.#state.lastFetch = new Date();
	}

	/**
	 * Simulate task execution (for demo purposes when CLI not available)
	 */
	async simulateExecution(id: string) {
		const task = this.getTask(id);
		if (!task || task.status !== 'pending') return;

		// Start task
		this.updateTask(id, {
			status: 'in_progress',
			assignee: 'polecat-' + Math.floor(Math.random() * 100)
		});

		// Simulate progress
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Complete task
		const success = Math.random() > 0.2;
		this.updateTask(id, {
			status: success ? 'completed' : 'blocked'
		});
	}
}

export const tasksStore = new TasksStore();
