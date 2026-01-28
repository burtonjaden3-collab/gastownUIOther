<script lang="ts">
	import { X, AlertTriangle } from 'lucide-svelte';
	import { Button, Input, Textarea } from '$lib/components/core';
	import { api } from '$lib/api/client';

	interface Props {
		prefillIds?: string[];
		onclose: () => void;
		oncreate: () => void;
	}

	let { prefillIds = [], onclose, oncreate }: Props = $props();

	let title = $state('');
	let issuesText = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		issuesText = prefillIds.join('\n');
	});
	let error = $state<string | null>(null);

	/** Bead ID format: alphanumeric prefix, hyphen, 5 alphanumeric chars */
	const BEAD_ID_RE = /^[a-zA-Z0-9]+-[a-zA-Z0-9]{5}$/;

	const issues = $derived(
		issuesText.split('\n').map(s => s.trim()).filter(Boolean)
	);

	const invalidIds = $derived(
		issues.filter(id => !BEAD_ID_RE.test(id))
	);

	const isValid = $derived(title.trim().length > 0 && issues.length > 0 && invalidIds.length === 0);

	async function handleSubmit() {
		if (!isValid || isSubmitting) return;
		isSubmitting = true;
		error = null;

		try {
			await api.createConvoy(title.trim(), issues);
			oncreate();
			onclose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create convoy';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="p-4 space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-200">New Convoy</h2>
		<button class="p-1 text-chrome-500 hover:text-chrome-300 transition-colors" onclick={onclose}>
			<X size={18} />
		</button>
	</div>

	<Input
		label="Title"
		placeholder="Convoy title..."
		bind:value={title}
		required
	/>

	<Textarea
		label="Issue IDs"
		placeholder="One issue ID per line..."
		bind:value={issuesText}
		hint="{issues.length} issue{issues.length !== 1 ? 's' : ''} added"
		rows={5}
		required
	/>

	{#if invalidIds.length > 0}
		<div class="flex items-start gap-2 text-sm text-warning-400">
			<AlertTriangle size={14} class="mt-0.5 flex-shrink-0" />
			<div>
				<p>Invalid issue ID{invalidIds.length > 1 ? 's' : ''}:</p>
				<ul class="font-mono text-xs mt-1 space-y-0.5">
					{#each invalidIds as id}
						<li class="text-warning-300">{id}</li>
					{/each}
				</ul>
				<p class="text-xs text-chrome-500 mt-1">Expected format: prefix-XXXXX (e.g. rig1-a1b2c)</p>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="flex items-center gap-2 text-sm text-red-400">
			<AlertTriangle size={14} />
			{error}
		</div>
	{/if}

	<div class="flex items-center gap-3 pt-2">
		<Button variant="secondary" size="sm" onclick={onclose}>Cancel</Button>
		<Button size="sm" disabled={!isValid || isSubmitting} onclick={handleSubmit}>
			{isSubmitting ? 'Creating...' : 'Create Convoy'}
		</Button>
	</div>
</div>
