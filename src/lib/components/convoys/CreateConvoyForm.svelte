<script lang="ts">
	import { X, Plus, AlertTriangle } from 'lucide-svelte';
	import { Card, Button, Input, Textarea } from '$lib/components/core';

	interface Props {
		onclose: () => void;
		oncreate: () => void;
	}

	let { onclose, oncreate }: Props = $props();

	let title = $state('');
	let issuesText = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	const issues = $derived(
		issuesText.split('\n').map(s => s.trim()).filter(Boolean)
	);

	const isValid = $derived(title.trim().length > 0 && issues.length > 0);

	async function handleSubmit() {
		if (!isValid || isSubmitting) return;

		isSubmitting = true;
		error = null;

		try {
			const response = await fetch('/api/gastown/convoys/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), issues })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to create convoy';
				return;
			}

			oncreate();
			onclose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create convoy';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card title="Create Convoy">
	<div class="space-y-4">
		{#if error}
			<div class="px-3 py-2 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
				<AlertTriangle size={14} />
				<span>{error}</span>
			</div>
		{/if}

		<div>
			<label for="convoy-title" class="block text-xs font-stencil uppercase text-chrome-400 mb-1">Title</label>
			<input
				id="convoy-title"
				type="text"
				bind:value={title}
				placeholder="Convoy title..."
				class="w-full px-3 py-2 bg-oil-900 border border-oil-700 rounded-sm text-sm font-mono text-chrome-200 placeholder-chrome-600 focus:border-rust-500 focus:outline-none"
			/>
		</div>

		<div>
			<label for="convoy-issues" class="block text-xs font-stencil uppercase text-chrome-400 mb-1">
				Issue IDs (one per line)
			</label>
			<textarea
				id="convoy-issues"
				bind:value={issuesText}
				placeholder="issue-1&#10;issue-2&#10;issue-3"
				rows="4"
				class="w-full px-3 py-2 bg-oil-900 border border-oil-700 rounded-sm text-sm font-mono text-chrome-200 placeholder-chrome-600 focus:border-rust-500 focus:outline-none resize-none"
			></textarea>
			{#if issues.length > 0}
				<p class="text-[10px] font-mono text-chrome-500 mt-1">{issues.length} issue(s)</p>
			{/if}
		</div>

		<div class="flex items-center justify-end gap-3 pt-2">
			<button
				class="px-4 py-2 rounded-sm font-stencil text-xs uppercase tracking-wider text-chrome-400 hover:text-chrome-200 transition-colors"
				onclick={onclose}
			>
				Cancel
			</button>
			<button
				class="px-4 py-2 rounded-sm font-stencil text-xs uppercase tracking-wider transition-all
					{isValid && !isSubmitting
						? 'bg-rust-600 text-white hover:bg-rust-500'
						: 'bg-oil-800 text-chrome-600 cursor-not-allowed'}"
				disabled={!isValid || isSubmitting}
				onclick={handleSubmit}
			>
				{isSubmitting ? 'Creating...' : 'Create Convoy'}
			</button>
		</div>
	</div>
</Card>
