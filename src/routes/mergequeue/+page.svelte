<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { Card } from '$lib/components/core';
	import { MergeRequestItem, MergeRequestDetail } from '$lib/components/mergequeue';
	import { mergeQueueStore } from '$lib/stores/mergequeue.svelte';
	import { AlertTriangle, Filter, RefreshCw, GitMerge } from 'lucide-svelte';

	onMount(() => { mergeQueueStore.fetch(); });

	type MRFilter = 'all' | 'queued' | 'processing' | 'merged' | 'conflict';
	let filter = $state<MRFilter>('all');

	const filtered = $derived(
		filter === 'all' ? mergeQueueStore.items : mergeQueueStore.items.filter(m => m.status === filter)
	);

	const filters: { value: MRFilter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'queued', label: 'Queued' },
		{ value: 'processing', label: 'Processing' },
		{ value: 'merged', label: 'Merged' },
		{ value: 'conflict', label: 'Conflicts' }
	];

	const stats = $derived(mergeQueueStore.stats);
	const selected = $derived(mergeQueueStore.selected);
</script>

<svelte:head>
	<title>Merge Queue | Gas Town</title>
</svelte:head>

<Header
	title="Merge Queue"
	subtitle="{stats.total} items, {stats.conflicts} conflicts"
	onRefresh={() => mergeQueueStore.fetch()}
/>

{#if mergeQueueStore.error}
	<div class="mx-6 mt-4 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono flex items-center gap-2">
		<AlertTriangle size={16} class="flex-shrink-0" />
		<span>{mergeQueueStore.error}</span>
	</div>
{/if}

<div class="flex h-[calc(100vh-theme(spacing.16)-65px)]">
	<div class="w-[420px] flex-shrink-0 border-r border-oil-700 overflow-y-auto">
		<div class="p-4 space-y-4">
			<div class="flex items-center gap-4 px-1 text-xs font-mono">
				<span class="text-chrome-400">{stats.total} total</span>
				<span class="text-chrome-600">|</span>
				<span class="text-chrome-500">{stats.queued} queued</span>
				{#if stats.conflicts > 0}
					<span class="text-red-400">{stats.conflicts} conflicts</span>
				{/if}
			</div>

			<div class="flex items-center gap-2 flex-wrap">
				<Filter size={14} class="text-chrome-500" />
				{#each filters as f}
					<button
						class="px-2.5 py-1 rounded-sm font-mono text-xs uppercase transition-all
							{filter === f.value
								? 'bg-rust-600/20 text-rust-400 border border-rust-500'
								: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
						onclick={() => filter = f.value}
					>
						{f.label}
					</button>
				{/each}
			</div>

			{#if mergeQueueStore.isLoading && mergeQueueStore.items.length === 0}
				<Card>
					<div class="text-center py-12">
						<RefreshCw size={24} class="text-chrome-500 animate-spin mx-auto mb-3" />
						<p class="text-chrome-500 font-mono">Loading merge queue...</p>
					</div>
				</Card>
			{:else if filtered.length === 0}
				<Card>
					<div class="text-center py-8">
						<p class="text-chrome-500 font-mono text-sm">No merge requests</p>
					</div>
				</Card>
			{:else}
				<div class="space-y-2">
					{#each filtered as mr (mr.id)}
						<MergeRequestItem
							id={mr.id}
							branch={mr.branch}
							rig={mr.rig}
							status={mr.status}
							author={mr.author}
							title={mr.title}
							submittedAt={mr.submittedAt}
							class={mergeQueueStore.selectedId === mr.id ? 'border-rust-500 bg-rust-600/10' : ''}
							onclick={() => mergeQueueStore.select(mergeQueueStore.selectedId === mr.id ? null : mr.id)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if selected}
			<div class="p-6">
				<MergeRequestDetail
					id={selected.id}
					branch={selected.branch}
					rig={selected.rig}
					status={selected.status}
					author={selected.author}
					title={selected.title}
					submittedAt={selected.submittedAt}
					mergedAt={selected.mergedAt}
					conflictReason={selected.conflictReason}
				/>
			</div>
		{:else}
			<div class="h-full flex items-center justify-center">
				<div class="text-center">
					<GitMerge size={48} class="text-oil-700 mx-auto mb-3" />
					<p class="text-chrome-500 font-mono text-sm">Select a merge request to view details</p>
				</div>
			</div>
		{/if}
	</div>
</div>
