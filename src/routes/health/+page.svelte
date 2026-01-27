<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { Card, ErrorAlert } from '$lib/components/core';
	import { RigHealthCard, SystemOverview, DiagnosticsPanel } from '$lib/components/health';
	import { healthStore } from '$lib/stores/health.svelte';
	import { RefreshCw, Stethoscope, Heart } from 'lucide-svelte';

	onMount(() => {
		healthStore.fetch();
	});
</script>

<svelte:head>
	<title>Health | Gas Town</title>
</svelte:head>

<Header
	title="Health"
	subtitle="System health monitoring"
	onRefresh={() => healthStore.fetch()}
/>

{#if healthStore.error}
	<ErrorAlert message={healthStore.error} onRetry={() => healthStore.fetch()} />
{/if}

<div class="p-6 space-y-6">
	{#if healthStore.health}
		<SystemOverview
			overallStatus={healthStore.health.overallStatus}
			rigCount={healthStore.health.rigHealth.length}
			lastCheck={healthStore.health.lastCheck}
		/>

		{#if healthStore.health.rigHealth.length > 0}
			<div>
				<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-400 mb-3">Rig Health</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{#each healthStore.health.rigHealth as rig (rig.rigName)}
						<RigHealthCard
							rigName={rig.rigName}
							witnessStatus={rig.witnessStatus}
							refineryStatus={rig.refineryStatus}
							polecatCount={rig.polecatCount}
							crewCount={rig.crewCount}
							issues={rig.issues}
						/>
					{/each}
				</div>
			</div>
		{/if}

		<DiagnosticsPanel diagnostics={healthStore.health.diagnostics} />

		<div class="flex justify-center">
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-sm font-stencil text-xs uppercase tracking-wider bg-rust-600/20 text-rust-400 border border-rust-500/50 hover:bg-rust-600/30 transition-all disabled:opacity-50"
				disabled={healthStore.isLoading}
				onclick={() => healthStore.runDiagnostics()}
			>
				<Stethoscope size={14} />
				{healthStore.isLoading ? 'Running...' : 'Run Diagnostics'}
			</button>
		</div>
	{:else if healthStore.isLoading}
		<Card>
			<div class="text-center py-12">
				<RefreshCw size={24} class="text-chrome-500 animate-spin mx-auto mb-3" />
				<p class="text-chrome-500 font-mono">Checking system health...</p>
			</div>
		</Card>
	{:else}
		<Card>
			<div class="text-center py-12">
				<Heart size={32} class="text-oil-700 mx-auto mb-3" />
				<p class="text-chrome-500 font-mono text-sm">No health data available</p>
			</div>
		</Card>
	{/if}
</div>
