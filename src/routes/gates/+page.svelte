<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { Card } from '$lib/components/core';
	import { GateCard } from '$lib/components/gates';
	import { gatesStore } from '$lib/stores/gates.svelte';
	import { AlertTriangle, Filter, RefreshCw, Timer } from 'lucide-svelte';

	onMount(() => { gatesStore.fetch(); });

	type GateFilter = 'all' | 'open' | 'closed';
	let filter = $state<GateFilter>('all');

	const filtered = $derived(
		filter === 'all' ? gatesStore.items : gatesStore.items.filter(g => g.status === filter)
	);

	const stats = $derived(gatesStore.stats);

	function handleCloseGate(id: string, reason: string) {
		gatesStore.closeGate(id, reason);
	}
</script>

<svelte:head>
	<title>Gates | Gas Town</title>
</svelte:head>

<Header
	title="Gates"
	subtitle="{stats.total} gates, {stats.open} open"
	onRefresh={() => gatesStore.fetch()}
/>

{#if gatesStore.error}
	<div class="mx-6 mt-4 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono flex items-center gap-2">
		<AlertTriangle size={16} class="flex-shrink-0" />
		<span class="flex-1">{gatesStore.error}</span>
		<button
			class="px-3 py-1 rounded-sm text-xs font-stencil uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
			onclick={() => gatesStore.fetch()}
		>
			Retry
		</button>
	</div>
{/if}

<div class="p-6 space-y-4">
	<div class="flex items-center gap-4">
		<div class="flex items-center gap-2">
			<Filter size={14} class="text-chrome-500" />
			{#each [{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }] as f}
				<button
					class="px-2.5 py-1 rounded-sm font-mono text-xs uppercase transition-all
						{filter === f.value
							? 'bg-rust-600/20 text-rust-400 border border-rust-500'
							: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
					onclick={() => filter = f.value as GateFilter}
				>
					{f.label}
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-3 text-xs font-mono text-chrome-500">
			<span>{stats.total} total</span>
			<span class="text-chrome-600">|</span>
			<span class="text-warning-400">{stats.open} open</span>
			<span class="text-green-400">{stats.closed} closed</span>
		</div>
	</div>

	{#if gatesStore.isLoading && gatesStore.items.length === 0}
		<Card>
			<div class="text-center py-12">
				<RefreshCw size={24} class="text-chrome-500 animate-spin mx-auto mb-3" />
				<p class="text-chrome-500 font-mono">Loading gates...</p>
			</div>
		</Card>
	{:else if filtered.length === 0}
		<Card>
			<div class="text-center py-12">
				<Timer size={32} class="text-oil-700 mx-auto mb-3" />
				<p class="text-chrome-500 font-mono text-sm">No gates found</p>
			</div>
		</Card>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
			{#each filtered as gate (gate.id)}
				<GateCard
					id={gate.id}
					awaitType={gate.awaitType}
					status={gate.status}
					createdAt={gate.createdAt}
					timeout={gate.timeout}
					waiters={gate.waiters}
					onclose={handleCloseGate}
				/>
			{/each}
		</div>
	{/if}
</div>
