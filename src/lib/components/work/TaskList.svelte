<script lang="ts">
	import { tasksStore, type TaskStatus, type Task } from '$lib/stores/tasks.svelte';
	import TaskRow from './TaskRow.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		selectedTaskId: string | null;
		checkedIds: Set<string>;
		onSelectTask: (id: string) => void;
		onCheckTask: (id: string, checked: boolean) => void;
		onCheckAll: (checked: boolean) => void;
		onSlingTask: (id: string) => void;
		onAddToConvoy: (id: string) => void;
	}

	let { selectedTaskId, checkedIds, onSelectTask, onCheckTask, onCheckAll, onSlingTask, onAddToConvoy }: Props = $props();

	let filter = $state<TaskStatus | 'all'>('all');

	const filteredTasks = $derived(
		filter === 'all'
			? tasksStore.items
			: tasksStore.items.filter(t => t.status === filter)
	);

	const stats = $derived(tasksStore.stats);

	const allVisibleChecked = $derived(
		filteredTasks.length > 0 && filteredTasks.every(t => checkedIds.has(t.id))
	);

	const filters: { value: TaskStatus | 'all'; label: string; count: number }[] = $derived([
		{ value: 'all', label: 'All', count: tasksStore.items.length },
		{ value: 'pending', label: 'Pending', count: stats.pending },
		{ value: 'in_progress', label: 'Running', count: stats.inProgress },
		{ value: 'completed', label: 'Done', count: stats.completed },
		{ value: 'blocked', label: 'Blocked', count: stats.blocked }
	]);
</script>

<div class="flex flex-col h-full">
	<!-- Stats Bar -->
	<div class="flex items-center gap-2 px-4 py-2 border-b border-oil-800 bg-oil-900/50 overflow-x-auto">
		{#each filters as f}
			<button
				class={cn(
					'px-3 py-1.5 rounded-sm font-mono text-xs uppercase whitespace-nowrap transition-all',
					filter === f.value
						? 'bg-rust-600/20 text-rust-400 border border-rust-500'
						: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'
				)}
				onclick={() => filter = f.value}
			>
				{f.label} <span class="ml-1 text-chrome-500">({f.count})</span>
			</button>
		{/each}
	</div>

	<!-- Select All Header -->
	<div class="flex items-center gap-3 px-4 py-2 border-b border-oil-800 bg-oil-900/30">
		<input
			type="checkbox"
			checked={allVisibleChecked}
			onchange={(e) => onCheckAll((e.target as HTMLInputElement).checked)}
			class="w-4 h-4 rounded-sm border-oil-600 bg-oil-950 text-flame-500
				focus:ring-rust-500 focus:ring-offset-0 cursor-pointer"
		/>
		<span class="text-xs text-chrome-500 font-mono">
			{filteredTasks.length} {filter === 'all' ? 'tasks' : filter}
		</span>
	</div>

	<!-- Task List -->
	<div class="flex-1 overflow-y-auto">
		{#if tasksStore.isLoading}
			<div class="flex items-center justify-center py-12 text-chrome-500">
				<span class="font-mono text-sm">Loading tasks...</span>
			</div>
		{:else if filteredTasks.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-chrome-500 gap-2">
				<span class="font-mono text-sm">No tasks found</span>
				<span class="text-xs text-chrome-600">
					{filter !== 'all' ? 'Try a different filter' : 'Create a new task to get started'}
				</span>
			</div>
		{:else}
			{#each filteredTasks as task (task.id)}
				<TaskRow
					{task}
					selected={selectedTaskId === task.id}
					checked={checkedIds.has(task.id)}
					oncheck={(checked) => onCheckTask(task.id, checked)}
					onclick={() => onSelectTask(task.id)}
					onSling={() => onSlingTask(task.id)}
					onAddToConvoy={() => onAddToConvoy(task.id)}
				/>
			{/each}
		{/if}
	</div>
</div>
