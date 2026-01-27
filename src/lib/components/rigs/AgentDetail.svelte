<script lang="ts">
	import { Unplug, Trash2 } from 'lucide-svelte';
	import type { Agent } from '$lib/stores/agents.svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { Card, Button, Badge } from '$lib/components/core';
	import { AGENT_STATUS_VARIANTS } from '$lib/utils/status';

	interface Props {
		agent: Agent;
		rig: Rig;
		onAction: (action: string) => void;
	}

	let { agent, rig, onAction }: Props = $props();

	let isLoading = $state<string | null>(null);
	let confirmAction = $state<string | null>(null);
	let error = $state<string | null>(null);

	// Clear transient state when the selected agent changes
	$effect(() => {
		agent;
		confirmAction = null;
		isLoading = null;
		error = null;
	});

	const isPolecat = $derived(agent.role === 'polecat');

	async function handleAction(action: string) {
		if (action === 'nuke' && !confirmAction) {
			confirmAction = action;
			return;
		}
		error = null;
		isLoading = action;
		try {
			await onAction(action);
			confirmAction = null;
		} catch (e) {
			error = e instanceof Error ? e.message : `Failed to ${action}`;
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
				{agent.name}
			</h2>
			<Badge variant={AGENT_STATUS_VARIANTS[agent.status] || 'chrome'}>
				{agent.status === 'running' ? 'BUSY' : agent.status.toUpperCase()}
			</Badge>
		</div>
		<p class="text-xs text-chrome-500 font-mono mt-1">
			Role: {agent.role} &bull; Rig: {rig.name}
		</p>
	</div>

	<!-- Current Work (if busy) -->
	{#if agent.status === 'running' && agent.hasWork}
		<Card title="Current Work">
			<p class="text-sm text-chrome-200 font-mono">Working on assigned task</p>
			{#if agent.unreadMail > 0}
				<p class="text-xs text-warning-400 mt-2">{agent.unreadMail} unread messages</p>
			{/if}
		</Card>
	{/if}

	<!-- Error -->
	{#if error}
		<div class="px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
			{error}
		</div>
	{/if}

	<!-- Actions -->
	<Card title="Actions">
		{#if confirmAction === 'nuke'}
			<div class="p-3 bg-red-900/20 border border-red-700/50 rounded-sm mb-4">
				<p class="text-sm text-chrome-200 mb-3">Nuke this polecat? It will be terminated immediately.</p>
				<div class="flex gap-2">
					<Button variant="ghost" size="sm" onclick={() => confirmAction = null}>Cancel</Button>
					<Button variant="danger" size="sm" onclick={() => handleAction('nuke')}>Confirm Nuke</Button>
				</div>
			</div>
		{/if}

		<div class="flex flex-wrap gap-2">
			{#if agent.hasWork}
				<Button
					variant="secondary"
					size="sm"
					disabled={isLoading !== null}
					onclick={() => handleAction('unsling')}
				>
					<Unplug size={14} />
					{isLoading === 'unsling' ? 'Unslinging...' : 'Unsling'}
				</Button>
			{/if}
			{#if isPolecat}
				<Button
					variant="danger"
					size="sm"
					disabled={isLoading !== null}
					onclick={() => handleAction('nuke')}
				>
					<Trash2 size={14} />
					{isLoading === 'nuke' ? 'Nuking...' : 'Nuke'}
				</Button>
			{/if}
		</div>

		{#if !agent.hasWork && !isPolecat}
			<p class="text-sm text-chrome-500">No actions available for idle {agent.role}.</p>
		{/if}
	</Card>
</div>
