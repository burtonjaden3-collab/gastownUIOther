<script lang="ts">
	import { convoysStore, type ConvoyDisplayStatus } from '$lib/stores/convoys.svelte';
	import ConvoyRow from './ConvoyRow.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		selectedConvoyId: string | null;
		onSelectConvoy: (id: string) => void;
	}

	let { selectedConvoyId, onSelectConvoy }: Props = $props();

	let filter = $state<ConvoyDisplayStatus | 'all'>('all');

	const filteredConvoys = $derived(
		filter === 'all'
			? convoysStore.items
			: convoysStore.items.filter(c => c.displayStatus === filter)
	);

	const stats = $derived(convoysStore.stats);

	const totalTracked = $derived(
		convoysStore.items.reduce((sum, c) => sum + c.trackedCount, 0)
	);

	const filters: { value: ConvoyDisplayStatus | 'all'; label: string; count: number }[] = $derived([
		{ value: 'all', label: 'All', count: convoysStore.items.length },
		{ value: 'pending', label: 'Open', count: stats.pending },
		{ value: 'in_progress', label: 'Active', count: stats.inProgress },
		{ value: 'blocked', label: 'Blocked', count: stats.blocked },
		{ value: 'completed', label: 'Closed', count: stats.completed }
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

	<!-- Summary -->
	<div class="px-4 py-2 border-b border-oil-800 bg-oil-900/30">
		<span class="text-xs text-chrome-500 font-mono">
			{convoysStore.items.length} convoys &middot; {totalTracked} tracked items
		</span>
	</div>

	<!-- Convoy List -->
	<div class="flex-1 overflow-y-auto">
		{#if filteredConvoys.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-chrome-500 gap-2">
				<span class="font-mono text-sm">No convoys found</span>
				<span class="text-xs text-chrome-600">
					{filter !== 'all' ? 'Try a different filter' : 'Create a convoy to group related work'}
				</span>
			</div>
		{:else}
			{#each filteredConvoys as convoy (convoy.id)}
				<ConvoyRow
					id={convoy.id}
					title={convoy.title}
					displayStatus={convoy.displayStatus}
					trackedCount={convoy.trackedCount}
					assignee={convoy.assignee}
					createdAt={convoy.createdAt}
					selected={selectedConvoyId === convoy.id}
					onclick={() => onSelectConvoy(convoy.id)}
				/>
			{/each}
		{/if}
	</div>
</div>
