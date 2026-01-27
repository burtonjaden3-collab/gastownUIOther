<script lang="ts">
	import { X, Send } from 'lucide-svelte';
	import type { Rig } from '$lib/stores/rigs.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { Card, Button, Input, Select } from '$lib/components/core';

	interface Props {
		rig: Rig;
		onSling: (beadId: string, target?: string) => Promise<void>;
		onCancel: () => void;
	}

	let { rig, onSling, onCancel }: Props = $props();

	let beadId = $state('');
	let target = $state('auto');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Validation constants
	const MAX_BEAD_ID_LENGTH = 64;
	const BEAD_ID_FORMAT = /^[a-zA-Z0-9._-]+$/;

	// Validation state
	const beadIdValidation = $derived(() => {
		const trimmed = beadId.trim();
		if (trimmed.length === 0) return { valid: false, error: null };
		if (trimmed.length > MAX_BEAD_ID_LENGTH) {
			return { valid: false, error: `Bead ID too long (max ${MAX_BEAD_ID_LENGTH} chars)` };
		}
		if (!BEAD_ID_FORMAT.test(trimmed)) {
			return { valid: false, error: 'Only alphanumeric, hyphens, underscores, and dots allowed' };
		}
		return { valid: true, error: null };
	});

	// Get unassigned tasks
	const availableBeads = $derived(
		tasksStore.items.filter((t) => t.status === 'pending' && !t.assignee)
	);

	const targetOptions = $derived([
		{ value: 'auto', label: 'Auto (spawn polecat)' },
		...rig.agents
			.filter((a) => a.role === 'crew' || a.role === 'witness')
			.map((a) => ({ value: a.name, label: `${a.name} (${a.role})` }))
	]);

	async function handleSubmit() {
		const validation = beadIdValidation();
		if (!beadId.trim()) {
			error = 'Please enter or select a bead ID';
			return;
		}
		if (!validation.valid) {
			error = validation.error;
			return;
		}

		error = null;
		isLoading = true;

		try {
			await onSling(beadId.trim(), target === 'auto' ? undefined : target);
			onCancel();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to sling work';
		} finally {
			isLoading = false;
		}
	}

	function selectBead(id: string) {
		beadId = id;
	}
</script>

<Card title="Sling Work to {rig.name}">
	<div class="space-y-4">
		<!-- Bead ID input -->
		<div>
			<label for="sling-bead-id" class="block text-xs text-chrome-500 font-mono uppercase mb-1">
				Bead ID
			</label>
			<Input
				id="sling-bead-id"
				bind:value={beadId}
				placeholder="e.g., mt-4fy"
			/>
			{#if beadId.trim().length > 0 && !beadIdValidation().valid}
				<p class="text-xs text-rust-400 mt-1">{beadIdValidation().error}</p>
			{/if}
		</div>

		<!-- Available beads -->
		{#if availableBeads.length > 0}
			<div>
				<span class="block text-xs text-chrome-500 font-mono uppercase mb-2">
					Or select from queue:
				</span>
				<div class="max-h-32 overflow-y-auto space-y-1">
					{#each availableBeads.slice(0, 5) as task (task.id)}
						<button
							class="w-full flex items-center gap-2 p-2 text-left text-sm rounded-sm
								transition-colors
								{beadId === task.id
									? 'bg-rust-600/20 border border-rust-500'
									: 'bg-oil-800 border border-oil-700 hover:border-oil-600'}"
							onclick={() => selectBead(task.id)}
						>
							<span class="font-mono text-xs text-rust-400">{task.id}</span>
							<span class="flex-1 truncate text-chrome-300">{task.title}</span>
							<span class="text-xs text-chrome-500">P{task.priority}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Target selection -->
		<div>
			<label for="sling-target" class="block text-xs text-chrome-500 font-mono uppercase mb-1">
				Target
			</label>
			<Select id="sling-target" bind:value={target} options={targetOptions} />
		</div>

		<!-- Error message -->
		{#if error}
			<p class="text-sm text-red-400">{error}</p>
		{/if}

		<!-- Actions -->
		<div class="flex gap-2 pt-2">
			<Button variant="ghost" onclick={onCancel} disabled={isLoading}>
				<X size={14} />
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={isLoading}>
				<Send size={14} />
				{isLoading ? 'Slinging...' : 'Sling'}
			</Button>
		</div>
	</div>
</Card>
