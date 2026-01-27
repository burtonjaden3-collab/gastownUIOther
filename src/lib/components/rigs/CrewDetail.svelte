<script lang="ts">
	import { Play, Square, Terminal, RefreshCw, Trash2 } from 'lucide-svelte';
	import type { Agent } from '$lib/stores/agents.svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { Card, Button, Badge } from '$lib/components/core';
	import { CREW_STATUS_VARIANTS } from '$lib/utils/status';

	interface Props {
		crew: Agent;
		rig: Rig;
		onAction: (action: string) => void;
	}

	let { crew, rig, onAction }: Props = $props();

	let isLoading = $state<string | null>(null);
	let confirmAction = $state<string | null>(null);
	let error = $state<string | null>(null);

	// Clear transient state when the selected crew changes
	$effect(() => {
		crew;
		confirmAction = null;
		isLoading = null;
		error = null;
	});

	async function handleAction(action: string) {
		if (action === 'remove' && !confirmAction) {
			confirmAction = action;
			return;
		}
		error = null;
		isLoading = action;
		try {
			await onAction(action);
			confirmAction = null;
		} catch (e) {
			error = e instanceof Error ? e.message : `Failed to ${action} crew`;
		} finally {
			isLoading = null;
		}
	}

</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-3">
			<h2 class="font-stencil text-2xl uppercase tracking-wider text-chrome-100">
				{crew.name}
			</h2>
			<Badge variant={CREW_STATUS_VARIANTS[crew.status] || 'chrome'}>
				{crew.status === 'running' ? 'ACTIVE' : crew.status.toUpperCase()}
			</Badge>
		</div>
		<p class="text-xs text-chrome-500 font-mono mt-1">
			Rig: {rig.name}
		</p>
	</div>

	<!-- Error -->
	{#if error}
		<div class="px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
			{error}
		</div>
	{/if}

	<!-- Actions -->
	<Card title="Actions">
		{#if confirmAction === 'remove'}
			<div class="p-3 bg-red-900/20 border border-red-700/50 rounded-sm mb-4">
				<p class="text-sm text-chrome-200 mb-3">Remove this crew workspace? This cannot be undone.</p>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" onclick={() => confirmAction = null}>Cancel</Button>
					<Button variant="danger" size="sm" onclick={() => handleAction('remove')}>Confirm Remove</Button>
				</div>
			</div>
		{/if}

		<div class="flex flex-wrap gap-2">
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('start')}
			>
				<Play size={14} />
				{isLoading === 'start' ? 'Starting...' : 'Start'}
			</Button>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('stop')}
			>
				<Square size={14} />
				{isLoading === 'stop' ? 'Stopping...' : 'Stop'}
			</Button>
			<span title="Attach requires terminal access (not available in web UI)">
				<Button
					variant="secondary"
					size="sm"
					disabled={true}
				>
					<Terminal size={14} />
					Attach
				</Button>
			</span>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('refresh')}
			>
				<RefreshCw size={14} />
				{isLoading === 'refresh' ? 'Refreshing...' : 'Refresh'}
			</Button>
			<Button
				variant="danger"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('remove')}
			>
				<Trash2 size={14} />
				{isLoading === 'remove' ? 'Removing...' : 'Remove'}
			</Button>
		</div>
	</Card>
</div>
