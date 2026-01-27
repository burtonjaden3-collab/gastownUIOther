<script lang="ts">
	import { X, UserPlus } from 'lucide-svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { Card, Button, Input } from '$lib/components/core';
	import { api } from '$lib/api/client';
	import { rigsStore } from '$lib/stores/rigs.svelte';
	import { agentsStore } from '$lib/stores/agents.svelte';

	interface Props {
		rig: Rig;
		onCancel: () => void;
	}

	let { rig, onCancel }: Props = $props();

	let workerName = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const NAME_RE = /^[a-zA-Z0-9_-]+$/;

	const nameError = $derived.by(() => {
		const trimmed = workerName.trim();
		if (trimmed.length === 0) return null;
		if (trimmed.length > 64) return 'Name too long (max 64 chars)';
		if (!NAME_RE.test(trimmed)) return 'Only letters, numbers, hyphens, underscores';
		return null;
	});

	const canSubmit = $derived(
		workerName.trim().length > 0 && !nameError && !isLoading
	);

	async function handleSubmit() {
		const trimmed = workerName.trim();
		if (!trimmed) {
			error = 'Worker name is required';
			return;
		}
		if (nameError) {
			error = nameError;
			return;
		}

		error = null;
		isLoading = true;

		try {
			await api.addCrew(rig.name, trimmed);
			await Promise.all([rigsStore.fetch(), agentsStore.fetch()]);
			onCancel();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add crew worker';
		} finally {
			isLoading = false;
		}
	}
</script>

<Card title="Add Crew Worker">
	<p class="text-xs text-chrome-500 font-mono mb-4">
		Rig: {rig.name}
	</p>

	<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<Input
			bind:value={workerName}
			label="Worker Name"
			placeholder="e.g., alice"
			required
			error={nameError ?? undefined}
			disabled={isLoading}
		/>

		{#if error}
			<p class="text-sm text-red-400">{error}</p>
		{/if}

		<div class="flex gap-2 pt-2">
			<Button variant="ghost" onclick={onCancel} disabled={isLoading}>
				<X size={14} />
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={!canSubmit}>
				<UserPlus size={14} />
				{isLoading ? 'Adding...' : 'Add Crew'}
			</Button>
		</div>
	</form>
</Card>
