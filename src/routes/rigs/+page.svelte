<!-- src/routes/rigs/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import {
		RigTree,
		RigDetail,
		AgentDetail,
		CrewDetail,
		SlingForm,
		AddRigForm,
		AddCrewForm,
		type Selection
	} from '$lib/components/rigs';
	import { ErrorAlert } from '$lib/components/core';
	import { api } from '$lib/api/client';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { agentsStore } from '$lib/stores/agents.svelte';

	type RigAction = 'start' | 'stop' | 'park' | 'restart' | 'remove';

	const rigActions: Record<RigAction, (name: string) => Promise<unknown>> = {
		start: (name) => api.startRig(name),
		stop: (name) => api.stopRig(name),
		park: (name) => api.parkRig(name),
		restart: (name) => api.restartRig(name),
		remove: (name) => api.removeRig(name)
	};

	onMount(() => {
		rigsStore.fetch();
		tasksStore.fetch();
	});

	let selection = $state<Selection>(null);
	let showSlingForm = $state(false);
	let showAddRigForm = $state(false);
	let showAddCrewForm = $state(false);

	function handleAddRig() {
		selection = null;
		showSlingForm = false;
		showAddCrewForm = false;
		showAddRigForm = true;
	}

	function handleAddCrew() {
		showSlingForm = false;
		showAddRigForm = false;
		showAddCrewForm = true;
	}

	function handleRefresh() {
		rigsStore.fetch();
	}

	async function handleRigAction(action: string) {
		if (!selection || selection.type !== 'rig') return;

		const handler = rigActions[action as RigAction];
		if (!handler) return;

		await handler(selection.rig.name);

		if (action === 'remove') {
			selection = null;
		}

		await Promise.all([rigsStore.fetch(), agentsStore.fetch()]);
	}

	async function handleAgentAction(action: string) {
		if (!selection || selection.type !== 'agent') return;

		const name = selection.agent.name;

		if (action === 'unsling') {
			await api.unslingAgent(name);
		} else if (action === 'nuke') {
			await api.nukePolecat(name);
		} else {
			return;
		}

		await Promise.all([rigsStore.fetch(), agentsStore.fetch()]);
	}

	async function handleCrewAction(action: string) {
		if (!selection || selection.type !== 'agent' || selection.agent.role !== 'crew') return;

		const name = selection.agent.name;

		const crewActions: Record<string, (n: string) => Promise<unknown>> = {
			start: (n) => api.startCrew(n),
			stop: (n) => api.stopCrew(n),
			refresh: (n) => api.refreshCrew(n),
			remove: (n) => api.removeCrew(n)
		};

		const handler = crewActions[action];
		if (!handler) return;

		await handler(name);
		await Promise.all([rigsStore.fetch(), agentsStore.fetch()]);
	}

	async function handleSling(beadId: string, target?: string) {
		if (!selection || selection.type !== 'rig') return;

		await api.slingWork(selection.rig.name, beadId, target);
		await Promise.all([rigsStore.fetch(), tasksStore.fetch(), agentsStore.fetch()]);
	}
</script>

<svelte:head>
	<title>Rigs | Gas Town</title>
</svelte:head>

<Header
	title="Rigs"
	subtitle="Rig management and work assignment"
	onRefresh={handleRefresh}
/>

{#if rigsStore.error}
	<ErrorAlert message={rigsStore.error} onRetry={() => rigsStore.fetch()} />
{/if}

<div class="flex h-[calc(100vh-theme(spacing.16))]">
	<!-- Tree Panel -->
	<div class="w-80 flex-shrink-0">
		<RigTree {selection} onSelect={(s) => { selection = s; showSlingForm = false; showAddRigForm = false; showAddCrewForm = false; }} onAddRig={handleAddRig} />
	</div>

	<!-- Detail Panel -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if showAddRigForm}
			<AddRigForm onCancel={() => showAddRigForm = false} />
		{:else if selection === null}
			<div class="h-full flex items-center justify-center">
				<p class="text-chrome-500 font-mono">Select a rig or agent to view details</p>
			</div>
		{:else if selection.type === 'rig'}
			{#if showSlingForm}
				<SlingForm
					rig={selection.rig}
					onSling={handleSling}
					onCancel={() => showSlingForm = false}
				/>
			{:else if showAddCrewForm}
				<AddCrewForm
					rig={selection.rig}
					onCancel={() => showAddCrewForm = false}
				/>
			{:else}
				<RigDetail
					rig={selection.rig}
					onAction={handleRigAction}
					onSling={() => showSlingForm = true}
					onAddCrew={handleAddCrew}
				/>
			{/if}
		{:else if selection.type === 'agent'}
			{#if selection.agent.role === 'crew'}
				<CrewDetail
					crew={selection.agent}
					rig={selection.rig}
					onAction={handleCrewAction}
				/>
			{:else}
				<AgentDetail
					agent={selection.agent}
					rig={selection.rig}
					onAction={handleAgentAction}
				/>
			{/if}
		{/if}
	</div>
</div>
