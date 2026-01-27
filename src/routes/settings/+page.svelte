<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { Card, Button, Select, ErrorAlert } from '$lib/components/core';
	import { EscalationRoutes, TownInfo } from '$lib/components/settings';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { tasksStore, type DetailLevel } from '$lib/stores/tasks.svelte';
	import { api } from '$lib/api/client';
	import { Save, RotateCcw, CheckCircle2 } from 'lucide-svelte';

	let detailLevel = $state<DetailLevel>(settingsStore.detailLevel);
	let autoRefresh = $state(settingsStore.autoRefresh);
	let refreshInterval = $state(settingsStore.refreshInterval);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let config = $state<any>(null);
	let configError = $state<string | null>(null);
	let saved = $state(false);

	onMount(async () => {
		try {
			const result = await api.getConfig();
			config = result.data;
		} catch (e) {
			configError = e instanceof Error ? e.message : 'Failed to load config';
		}
	});

	const detailOptions = [
		{ value: 'minimal', label: 'Minimal - Just status' },
		{ value: 'normal', label: 'Normal - Status + Progress' },
		{ value: 'verbose', label: 'Verbose - Full details + Logs' }
	];

	const refreshOptions = [
		{ value: '2', label: '2 seconds' },
		{ value: '5', label: '5 seconds' },
		{ value: '10', label: '10 seconds' },
		{ value: '30', label: '30 seconds' }
	];

	function handleSave() {
		settingsStore.updateAll({ detailLevel, autoRefresh, refreshInterval });
		tasksStore.setDetailLevel(detailLevel);
		saved = true;
		setTimeout(() => { saved = false; }, 2000);
	}

	function handleReset() {
		settingsStore.reset();
		detailLevel = settingsStore.detailLevel;
		autoRefresh = settingsStore.autoRefresh;
		refreshInterval = settingsStore.refreshInterval;
		tasksStore.setDetailLevel(detailLevel);
	}

	async function retryConfig() {
		configError = null;
		try {
			const result = await api.getConfig();
			config = result.data;
		} catch (e) {
			configError = e instanceof Error ? e.message : 'Failed to load config';
		}
	}
</script>

<svelte:head>
	<title>Settings | Gas Town</title>
</svelte:head>

<Header
	title="Settings"
	subtitle="Configure your Gas Town experience"
/>

<div class="p-6 max-w-2xl space-y-6">
	<!-- Display Settings -->
	<Card title="Display">
		<div class="space-y-4">
			<Select
				id="detail-level"
				label="Detail Level"
				options={detailOptions}
				bind:value={detailLevel}
				hint="Controls how much information is shown for tasks and agents"
			/>
		</div>
	</Card>

	<!-- Auto Refresh -->
	<Card title="Auto Refresh">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-stencil text-sm uppercase text-chrome-300">Enable Auto Refresh</p>
					<p class="text-xs text-chrome-500 mt-1">Automatically update task and agent status</p>
				</div>
				<button
					class="relative w-12 h-6 rounded-full transition-colors {autoRefresh ? 'bg-rust-600' : 'bg-oil-700'}"
					onclick={() => autoRefresh = !autoRefresh}
					aria-label="Toggle auto refresh"
					role="switch"
					aria-checked={autoRefresh}
				>
					<span
						class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform {autoRefresh ? 'translate-x-6' : 'translate-x-0'}"
					></span>
				</button>
			</div>

			{#if autoRefresh}
				<Select
					id="refresh-interval"
					label="Refresh Interval"
					options={refreshOptions}
					bind:value={refreshInterval}
				/>
			{/if}
		</div>
	</Card>

	<!-- Town Info -->
	{#if config?.town}
		<TownInfo
			name={config.town.name || 'Gas Town'}
			owner={config.town.owner || 'unknown'}
			createdAt={config.town.createdAt || config.town.created_at || new Date().toISOString()}
			rigCount={config.rigs?.length ?? 0}
			overseer={config.overseer?.name}
		/>
	{/if}

	<!-- Escalation Routes -->
	{#if config?.escalation?.routes}
		<EscalationRoutes
			routes={config.escalation.routes}
			staleThreshold={config.escalation.staleThreshold}
			maxReescalations={config.escalation.maxReescalations}
		/>
	{/if}

	{#if configError}
		<ErrorAlert message={configError} onRetry={retryConfig} />
	{/if}

	<!-- Actions -->
	<div class="flex items-center justify-between pt-4">
		<Button variant="ghost" onclick={handleReset}>
			<RotateCcw size={16} />
			<span>Reset to Defaults</span>
		</Button>

		<div class="flex items-center gap-3">
			{#if saved}
				<span class="flex items-center gap-1.5 text-green-400 text-sm font-mono">
					<CheckCircle2 size={14} />
					Saved
				</span>
			{/if}
			<Button variant="primary" onclick={handleSave}>
				<Save size={16} />
				<span>Save Settings</span>
			</Button>
		</div>
	</div>
</div>
