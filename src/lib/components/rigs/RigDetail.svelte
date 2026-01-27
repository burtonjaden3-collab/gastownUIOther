<script lang="ts">
	import { Play, Square, ParkingCircle, RotateCw, Send, Trash2, UserPlus } from 'lucide-svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { Card, Button, Badge } from '$lib/components/core';

	interface Props {
		rig: Rig;
		onAction: (action: string) => void;
		onSling: () => void;
		onAddCrew: () => void;
	}

	let { rig, onAction, onSling, onAddCrew }: Props = $props();

	let isLoading = $state<string | null>(null);
	let confirmAction = $state<string | null>(null);
	let error = $state<string | null>(null);

	// Clear transient state when the selected rig changes
	$effect(() => {
		rig;
		confirmAction = null;
		isLoading = null;
		error = null;
	});

	const destructiveActions = ['stop', 'remove'];

	async function handleAction(action: string) {
		if (destructiveActions.includes(action) && confirmAction !== action) {
			confirmAction = action;
			return;
		}
		error = null;
		isLoading = action;
		try {
			await onAction(action);
			confirmAction = null;
		} catch (e) {
			error = e instanceof Error ? e.message : `Failed to ${action} rig`;
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
				{rig.name}
			</h2>
			<Badge variant={rig.status === 'active' ? 'success' : 'chrome'}>
				{rig.status.toUpperCase()}
			</Badge>
		</div>
		{#if rig.addedAt}
			<p class="text-xs text-chrome-500 font-mono mt-1">Added: {rig.addedAt}</p>
		{/if}
	</div>

	<!-- Stats -->
	<Card>
		<div class="flex flex-wrap gap-4">
			<div class="flex items-center gap-2">
				<span class="text-lg font-stencil text-chrome-100">{rig.polecatCount}</span>
				<span class="text-xs text-chrome-500 uppercase">Polecats</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-lg font-stencil text-chrome-100">{rig.crewCount}</span>
				<span class="text-xs text-chrome-500 uppercase">Crews</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 rounded-full {rig.hasWitness ? 'bg-green-500' : 'bg-neutral-500'}"></span>
				<span class="text-xs text-chrome-500 uppercase">Witness</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 rounded-full {rig.hasRefinery ? 'bg-green-500' : 'bg-neutral-500'}"></span>
				<span class="text-xs text-chrome-500 uppercase">Refinery</span>
			</div>
		</div>
	</Card>

	<!-- Error -->
	{#if error}
		<div class="px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
			{error}
		</div>
	{/if}

	<!-- Actions -->
	<Card title="Actions">
		{#if confirmAction === 'stop'}
			<div class="p-3 bg-red-900/20 border border-red-700/50 rounded-sm mb-4">
				<p class="text-sm text-chrome-200 mb-3">Stop this rig? Running agents will be terminated.</p>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" onclick={() => confirmAction = null}>Cancel</Button>
					<Button variant="danger" size="sm" onclick={() => handleAction('stop')}>Confirm Stop</Button>
				</div>
			</div>
		{:else if confirmAction === 'remove'}
			<div class="p-3 bg-red-900/20 border border-red-700/50 rounded-sm mb-4">
				<p class="text-sm text-chrome-200 mb-3">Remove this rig from the registry? This does not delete files on disk.</p>
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
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('park')}
			>
				<ParkingCircle size={14} />
				{isLoading === 'park' ? 'Parking...' : 'Park'}
			</Button>
			<Button
				variant="secondary"
				size="sm"
				disabled={isLoading !== null}
				onclick={() => handleAction('restart')}
			>
				<RotateCw size={14} />
				{isLoading === 'restart' ? 'Restarting...' : 'Restart'}
			</Button>
		</div>

		<div class="mt-4 pt-4 border-t border-oil-700 flex items-center justify-between">
			<div class="flex gap-2">
				<Button variant="primary" onclick={onSling}>
					<Send size={14} />
					Sling Work...
				</Button>
				<Button variant="secondary" onclick={onAddCrew}>
					<UserPlus size={14} />
					Add Crew...
				</Button>
			</div>
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
