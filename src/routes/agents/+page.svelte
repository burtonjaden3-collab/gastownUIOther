<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { Card, Button, Badge, ErrorAlert } from '$lib/components/core';
	import { AgentCard, Gauge } from '$lib/components/status';
	import { NudgeForm } from '$lib/components/agents';
	import { agentsStore, type AgentRole } from '$lib/stores/agents.svelte';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { RefreshCw, Filter, Send, Radio } from 'lucide-svelte';

	let showNudgeForm = $state(false);

	// Fetch agents on mount
	onMount(() => {
		agentsStore.fetch();
	});

	let selectedRig = $state<string | null>(null);
	let filter = $state<AgentRole | 'all'>('all');

	// Rig names derived from the rigs store (reactive to additions/removals)
	const rigNames = $derived(rigsStore.items.map(r => r.name));

	// Reset rig filter if the selected rig is removed
	$effect(() => {
		if (selectedRig && !rigNames.includes(selectedRig)) {
			selectedRig = null;
		}
	});

	// Agents filtered by rig first, then by role
	const rigFilteredAgents = $derived(
		selectedRig
			? agentsStore.items.filter(a => a.rig === selectedRig)
			: agentsStore.items
	);

	const filteredAgents = $derived(
		filter === 'all'
			? rigFilteredAgents
			: rigFilteredAgents.filter(a => a.role === filter)
	);

	const filters: { value: AgentRole | 'all'; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'polecat', label: 'Polecats' },
		{ value: 'witness', label: 'Witness' },
		{ value: 'deacon', label: 'Deacon' },
		{ value: 'refinery', label: 'Refinery' },
		{ value: 'crew', label: 'Crew' },
		{ value: 'overseer', label: 'Overseer' }
	];

	function handleRefresh() {
		agentsStore.fetch();
	}

	// Stats computed from the filtered agents (scoped to both filters)
	const stats = $derived({
		total: filteredAgents.length,
		online: filteredAgents.filter(a => a.status !== 'offline').length,
		busy: filteredAgents.filter(a => a.status === 'running').length,
		avgLoad: filteredAgents.length > 0
			? Math.round((filteredAgents.filter(a => a.status === 'running').length / filteredAgents.length) * 100)
			: 0
	});
</script>

<svelte:head>
	<title>Agents | Gas Town</title>
</svelte:head>

<Header
	title="Agents"
	subtitle="Worker agents and their status"
	onRefresh={handleRefresh}
/>

<div class="mx-6 mt-4 flex items-center gap-3">
	<button
		class="flex items-center gap-2 px-3 py-1.5 rounded-sm font-stencil text-xs uppercase tracking-wider transition-all
			{showNudgeForm
				? 'bg-rust-600/20 text-rust-400 border border-rust-500'
				: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
		onclick={() => showNudgeForm = !showNudgeForm}
	>
		<Send size={14} />
		Nudge / Broadcast
	</button>
</div>

{#if showNudgeForm}
	<div class="mx-6 mt-4">
		<NudgeForm
			agents={agentsStore.items.map(a => ({ name: a.name, address: a.address || a.name }))}
			onclose={() => showNudgeForm = false}
		/>
	</div>
{/if}

{#if agentsStore.error}
	<ErrorAlert message={agentsStore.error} onRetry={() => agentsStore.fetch()} />
{/if}

<div class="p-6 space-y-6">
	<!-- Stats Overview -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<Card>
			<div class="text-center">
				<p class="text-3xl font-stencil text-chrome-100">{stats.total}</p>
				<p class="text-xs font-mono uppercase text-chrome-500">Total Agents</p>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<p class="text-3xl font-stencil text-green-400">{stats.online}</p>
				<p class="text-xs font-mono uppercase text-chrome-500">Online</p>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<p class="text-3xl font-stencil text-warning-400">{stats.busy}</p>
				<p class="text-xs font-mono uppercase text-chrome-500">Busy</p>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<p class="text-3xl font-stencil text-chrome-400">{stats.avgLoad}%</p>
				<p class="text-xs font-mono uppercase text-chrome-500">Avg Load</p>
			</div>
		</Card>
	</div>

	<!-- Rig Filter -->
	{#if rigNames.length > 0}
		<div class="flex items-center gap-2 flex-wrap">
			<Filter size={16} class="text-chrome-500" />
			<button
				class="px-3 py-1.5 rounded-sm font-mono text-xs uppercase transition-all
					{selectedRig === null
						? 'bg-rust-600/20 text-rust-400 border border-rust-500'
						: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
				onclick={() => selectedRig = null}
			>
				All Rigs
				<span class="ml-1 text-chrome-500">({rigNames.length})</span>
			</button>
			{#each rigNames as rig}
				<button
					class="px-3 py-1.5 rounded-sm font-mono text-xs uppercase transition-all
						{selectedRig === rig
							? 'bg-rust-600/20 text-rust-400 border border-rust-500'
							: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
					onclick={() => selectedRig = selectedRig === rig ? null : rig}
				>
					{rig}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Role Filter -->
	<div class="flex items-center gap-2 flex-wrap">
		<Filter size={16} class="text-chrome-500" />
		{#each filters as f}
			{@const count = f.value === 'all'
				? rigFilteredAgents.length
				: rigFilteredAgents.filter(a => a.role === f.value).length}
			<button
				class="px-3 py-1.5 rounded-sm font-mono text-xs uppercase transition-all
					{filter === f.value
						? 'bg-rust-600/20 text-rust-400 border border-rust-500'
						: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
				onclick={() => filter = f.value}
			>
				{f.label}
				<span class="ml-1 text-chrome-500">({count})</span>
			</button>
		{/each}
	</div>

	<!-- Agents Grid -->
	{#if (agentsStore.isLoading || !agentsStore.lastFetch) && agentsStore.items.length === 0 && !agentsStore.error}
		<Card>
			<div class="text-center py-12">
				<RefreshCw size={24} class="text-chrome-500 animate-spin mx-auto mb-3" />
				<p class="text-chrome-500 font-mono">Loading agents...</p>
			</div>
		</Card>
	{:else if filteredAgents.length === 0}
		<Card>
			<div class="text-center py-12">
				<p class="text-chrome-500 font-mono">No agents found</p>
			</div>
		</Card>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
			{#each filteredAgents as agent (agent.id)}
				<AgentCard
					name={agent.name}
					role={agent.role}
					status={agent.status}
					hasWork={agent.hasWork}
					unreadMail={agent.unreadMail}
					currentTask={agent.currentTask}
				/>
			{/each}
		</div>
	{/if}
</div>
