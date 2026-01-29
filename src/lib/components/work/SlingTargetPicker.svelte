<script lang="ts">
	import { Crosshair } from 'lucide-svelte';
	import { Button, Select, ConfirmDialog, Input, Textarea } from '$lib/components/core';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
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
	let args = $state('');
	let message = $state('');
	let subject = $state('');
	let account = $state('');
	let create = $state(true);
	let force = $state(false);
	let noConvoy = $state(false);

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
		const opts = [
			{ value: 'auto', label: 'Auto (spawn polecat)' },
			{ value: 'deacon/dogs', label: 'Deacon dogs (auto idle)' },
			{ value: 'mayor', label: 'Mayor' }
		];
		if (currentRig) {
			for (const agent of currentRig.agents) {
				if (agent.role === 'crew' || agent.role === 'witness' || agent.role === 'polecat') {
					opts.push({ value: agent.name, label: `${agent.name} (${agent.role})` });
				}
				if (agent.role === 'polecat') {
					opts.push({ value: `${currentRig.name}/${agent.name}`, label: `${agent.name} (polecat @ ${currentRig.name})` });
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
			await api.slingWork(selectedRig, beadId, {
				target: target === 'auto' ? undefined : target,
				args: args.trim() || undefined,
				message: message.trim() || undefined,
				subject: subject.trim() || undefined,
				account: account.trim() || undefined,
				create,
				force,
				noConvoy
			});
			showConfirm = false;
			toastStore.success(`Slung ${beadId} to ${selectedRig}${target !== 'auto' ? ` (${target})` : ''}`);
			onSlung();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to sling work';
			toastStore.error(error);
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
			<a
				href="/rigs"
				class="inline-flex items-center justify-center mt-3 px-3 py-2 text-xs font-stencil uppercase tracking-wider rounded-sm border border-rust-500 text-rust-300 hover:bg-rust-600/20 transition-colors"
			>
				Go to Rigs
			</a>
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
			<Input label="Account (optional)" placeholder="work / prod / ..." bind:value={account} />
			<Textarea label="Args / instructions" placeholder="e.g., focus on tests, skip deps" rows={2} bind:value={args} />
			<Input label="Subject (optional)" placeholder="Context subject" bind:value={subject} />
			<Textarea label="Message (optional)" placeholder="Short briefing for the executor" rows={2} bind:value={message} />
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs text-chrome-400">
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={create} class="accent-rust-500" />
					Create polecat if missing
				</label>
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={force} class="accent-rust-500" />
					Force (ignore unread mail)
				</label>
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={noConvoy} class="accent-rust-500" />
					Skip auto-convoy
				</label>
			</div>
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
