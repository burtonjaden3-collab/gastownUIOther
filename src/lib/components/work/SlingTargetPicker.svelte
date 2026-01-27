<script lang="ts">
	import { Crosshair } from 'lucide-svelte';
	import { Button, Select, ConfirmDialog } from '$lib/components/core';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { api } from '$lib/api/client';

	interface Props {
		beadId: string;
		onSlung: () => void;
	}

	let { beadId, onSlung }: Props = $props();

	let selectedRig = $state('');
	let target = $state('auto');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let showConfirm = $state(false);

	const runningRigs = $derived(
		rigsStore.items.filter(r => r.status === 'active')
	);

	const rigOptions = $derived(
		runningRigs.map(r => ({ value: r.name, label: r.name }))
	);

	const currentRig = $derived(
		runningRigs.find(r => r.name === selectedRig)
	);

	const targetOptions = $derived.by(() => {
		const opts = [{ value: 'auto', label: 'Auto (spawn polecat)' }];
		if (currentRig) {
			for (const agent of currentRig.agents) {
				if (agent.role === 'crew' || agent.role === 'witness') {
					opts.push({ value: agent.name, label: `${agent.name} (${agent.role})` });
				}
			}
		}
		return opts;
	});

	const canSling = $derived(beadId.length > 0 && selectedRig.length > 0);

	function handleSlingClick() {
		if (!canSling) return;
		showConfirm = true;
	}

	async function executeSling() {
		isLoading = true;
		error = null;

		try {
			await api.slingWork(selectedRig, beadId, target === 'auto' ? undefined : target);
			showConfirm = false;
			onSlung();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to sling work';
			showConfirm = false;
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="space-y-4">
	{#if runningRigs.length === 0}
		<div class="p-6 text-center">
			<p class="text-chrome-400 text-sm">No rigs are running.</p>
			<p class="text-chrome-500 text-xs mt-1">Start a rig from the Fleet page first.</p>
		</div>
	{:else}
		<Select
			label="Rig"
			placeholder="Select a rig..."
			options={rigOptions}
			bind:value={selectedRig}
		/>

		{#if selectedRig}
			<Select
				label="Target"
				options={targetOptions}
				bind:value={target}
			/>
		{/if}

		{#if error}
			<p class="text-sm text-red-400">{error}</p>
		{/if}

		<Button
			size="md"
			disabled={!canSling || isLoading}
			onclick={handleSlingClick}
			class="w-full bg-gradient-to-r from-flame-600 to-rust-600 border-flame-700 hover:from-flame-500 hover:to-rust-500"
		>
			<Crosshair size={16} />
			Sling Work
		</Button>
	{/if}
</div>

<ConfirmDialog
	open={showConfirm}
	title="Confirm Sling"
	description="Dispatch work to the selected rig. This action cannot be undone."
	confirmLabel="Sling"
	confirmVariant="primary"
	{isLoading}
	onConfirm={executeSling}
	onCancel={() => { showConfirm = false; }}
>
	<div class="space-y-2 text-sm font-mono">
		<div class="flex justify-between">
			<span class="text-chrome-500">Bead</span>
			<span class="text-chrome-200">{beadId}</span>
		</div>
		<div class="flex justify-between">
			<span class="text-chrome-500">Rig</span>
			<span class="text-chrome-200">{selectedRig}</span>
		</div>
		<div class="flex justify-between">
			<span class="text-chrome-500">Target</span>
			<span class="text-chrome-200">{target === 'auto' ? 'Auto (spawn polecat)' : target}</span>
		</div>
	</div>
</ConfirmDialog>
