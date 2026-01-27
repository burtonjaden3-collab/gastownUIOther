<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { Card } from '$lib/components/core';
	import { DaemonStatusCard, PatrolConfig, DaemonLogs } from '$lib/components/daemon';
	import { daemonStore } from '$lib/stores/daemon.svelte';
	import { AlertTriangle, Play, Square, RefreshCw } from 'lucide-svelte';

	onMount(() => {
		daemonStore.fetchStatus();
		daemonStore.fetchLogs();
	});

	let confirmAction = $state<'start' | 'stop' | null>(null);
	let actionInProgress = $state(false);

	function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
		let timer: ReturnType<typeof setTimeout>;
		return ((...args: Parameters<T>) => {
			clearTimeout(timer);
			timer = setTimeout(() => fn(...args), ms);
		}) as T;
	}

	const debouncedRefresh = debounce(() => {
		daemonStore.fetchStatus();
		daemonStore.fetchLogs();
	}, 1_000);

	async function handleAction(action: 'start' | 'stop') {
		if (actionInProgress) return;
		confirmAction = null;
		actionInProgress = true;
		try {
			if (action === 'start') {
				await daemonStore.startServices();
			} else {
				await daemonStore.stopServices();
			}
			await daemonStore.fetchLogs();
		} finally {
			actionInProgress = false;
		}
	}
</script>

<svelte:head>
	<title>Daemon | Gas Town</title>
</svelte:head>

<Header
	title="Daemon"
	subtitle="Service lifecycle management"
	onRefresh={debouncedRefresh}
/>

{#if daemonStore.error}
	<div class="mx-6 mt-4 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono flex items-center gap-2">
		<AlertTriangle size={16} class="flex-shrink-0" />
		<span>{daemonStore.error}</span>
	</div>
{/if}

<div class="p-6 space-y-6">
	{#if daemonStore.status}
		<!-- Status + Actions -->
		<div class="flex items-start gap-4">
			<div class="flex-1">
				<DaemonStatusCard
					running={daemonStore.status.running}
					pid={daemonStore.status.pid}
					uptime={daemonStore.status.uptime}
					heartbeat={daemonStore.status.heartbeat}
				/>
			</div>
			<div class="flex flex-col gap-2">
				{#if confirmAction}
					<div class="p-3 rounded-sm bg-oil-800 border border-warning-500/50 space-y-2">
						<p class="text-xs font-mono text-warning-400">
							{confirmAction === 'start' ? 'Start all services?' : 'Stop all services?'}
						</p>
						<div class="flex gap-2">
							<button
								class="px-3 py-1.5 rounded-sm text-xs font-stencil uppercase bg-rust-600 text-white hover:bg-rust-500"
								onclick={() => handleAction(confirmAction!)}
							>
								Confirm
							</button>
							<button
								class="px-3 py-1.5 rounded-sm text-xs font-stencil uppercase text-chrome-400 hover:text-chrome-200"
								onclick={() => confirmAction = null}
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<button
						class="flex items-center gap-2 px-4 py-2 rounded-sm font-stencil text-xs uppercase tracking-wider bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600/30 transition-all disabled:opacity-50"
						disabled={daemonStore.isLoading || actionInProgress}
						onclick={() => confirmAction = 'start'}
					>
						<Play size={14} />
						Start
					</button>
					<button
						class="flex items-center gap-2 px-4 py-2 rounded-sm font-stencil text-xs uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30 transition-all disabled:opacity-50"
						disabled={daemonStore.isLoading || actionInProgress}
						onclick={() => confirmAction = 'stop'}
					>
						<Square size={14} />
						Stop
					</button>
				{/if}
			</div>
		</div>

		<!-- Patrols -->
		<PatrolConfig patrols={daemonStore.status.patrols} />
	{:else if daemonStore.isLoading}
		<Card>
			<div class="text-center py-12">
				<RefreshCw size={24} class="text-chrome-500 animate-spin mx-auto mb-3" />
				<p class="text-chrome-500 font-mono">Loading daemon status...</p>
			</div>
		</Card>
	{/if}

	<!-- Logs -->
	<DaemonLogs logs={daemonStore.logs} />
</div>
