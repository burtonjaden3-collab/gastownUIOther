<script lang="ts">
	import { Search, Clock, Crosshair } from 'lucide-svelte';
	import Badge from '$lib/components/core/Badge.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import SlingTargetPicker from './SlingTargetPicker.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		preSelectedTaskId?: string | null;
	}

	let { preSelectedTaskId = null }: Props = $props();

	let selectedId = $state<string | null>(null);
	let searchQuery = $state('');

	$effect(() => {
		if (preSelectedTaskId) {
			selectedId = preSelectedTaskId;
		}
	});

	const pendingTasks = $derived(
		tasksStore.items.filter(t => t.status === 'pending' && !t.assignee)
	);

	const filteredTasks = $derived(
		searchQuery.trim()
			? pendingTasks.filter(t =>
				t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.id.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: pendingTasks
	);

	const selectedTask = $derived(
		selectedId ? pendingTasks.find(t => t.id === selectedId) : undefined
	);

	async function handleSlung() {
		const slungId = selectedId;
		await tasksStore.fetch();
		const remaining = pendingTasks.filter(t => t.id !== slungId);
		selectedId = remaining.length > 0 ? remaining[0].id : null;
	}
</script>

<div class="flex h-full">
	<!-- Left Column: Task Picker -->
	<div class="w-[420px] flex-shrink-0 border-r border-oil-700 flex flex-col">
		<div class="p-3 border-b border-oil-800">
			<div class="relative">
				<Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
				<input
					type="text"
					placeholder="Search tasks..."
					bind:value={searchQuery}
					class="w-full pl-9 pr-3 py-2 bg-oil-950 border border-oil-700 rounded-sm
						font-mono text-sm text-chrome-100 placeholder:text-chrome-600
						focus:outline-none focus:border-rust-500"
				/>
			</div>
			<p class="mt-2 text-xs text-chrome-500 font-mono">
				{pendingTasks.length} unassigned pending
			</p>
		</div>

		<div class="flex-1 overflow-y-auto">
			{#if filteredTasks.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-chrome-500 gap-2">
					<Crosshair size={24} class="text-chrome-600" />
					<span class="font-mono text-sm">All caught up.</span>
					<span class="text-xs text-chrome-600">No unassigned tasks in the queue.</span>
				</div>
			{:else}
				{#each filteredTasks as task (task.id)}
					<button
						class={cn(
							'w-full text-left px-4 py-3 border-b border-oil-800 transition-all',
							selectedId === task.id
								? 'bg-rust-600/10 border-l-2 border-l-rust-500'
								: 'hover:bg-oil-800/50'
						)}
						onclick={() => selectedId = task.id}
					>
						<div class="flex items-center gap-2 mb-0.5">
							<span class="font-mono text-sm text-chrome-100 truncate">{task.title}</span>
							<Badge variant="chrome">{task.type.toUpperCase()}</Badge>
						</div>
						<div class="flex items-center gap-2 text-xs text-chrome-500">
							<span class="font-mono">{task.id.slice(0, 8)}</span>
							<span>&middot;</span>
							<Clock size={10} />
							<span>{task.createdAt}</span>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Right Column: Target Picker -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if selectedTask}
			<div class="mb-4 pb-4 border-b border-oil-800">
				<p class="text-xs text-chrome-500 uppercase font-stencil tracking-wider mb-1">Selected Task</p>
				<h3 class="font-display text-base text-chrome-100">{selectedTask.title}</h3>
				<p class="text-xs text-chrome-500 font-mono mt-1">{selectedTask.id}</p>
			</div>

			<SlingTargetPicker
				beadId={selectedTask.id}
				onSlung={handleSlung}
			/>
		{:else}
			<div class="flex flex-col items-center justify-center h-full text-chrome-500 gap-2">
				<Crosshair size={32} class="text-chrome-600" />
				<span class="font-stencil text-sm uppercase">Select a task</span>
				<span class="text-xs text-chrome-600">Pick a task from the left to assign it to a rig</span>
			</div>
		{/if}
	</div>
</div>
