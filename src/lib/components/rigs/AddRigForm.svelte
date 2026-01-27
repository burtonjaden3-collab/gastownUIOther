<script lang="ts">
	import { X, Plus } from 'lucide-svelte';
	import { Card, Button, Input } from '$lib/components/core';
	import { api } from '$lib/api/client';
	import { rigsStore } from '$lib/stores/rigs.svelte';

	interface Props {
		onCancel: () => void;
	}

	let { onCancel }: Props = $props();

	let name = $state('');
	let gitUrl = $state('');
	let branch = $state('');
	let prefix = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const NAME_RE = /^[a-zA-Z0-9_-]+$/;

	const nameError = $derived.by(() => {
		const trimmed = name.trim();
		if (trimmed.length === 0) return null;
		if (trimmed.length > 64) return 'Name too long (max 64 chars)';
		if (!NAME_RE.test(trimmed)) return 'Only letters, numbers, hyphens, underscores';
		return null;
	});

	const urlError = $derived.by(() => {
		const trimmed = gitUrl.trim();
		if (trimmed.length === 0) return null;
		if (trimmed.length > 512) return 'URL too long (max 512 chars)';
		return null;
	});

	const canSubmit = $derived(
		name.trim().length > 0 &&
		gitUrl.trim().length > 0 &&
		!nameError &&
		!urlError &&
		!isLoading
	);

	async function handleSubmit() {
		if (!name.trim()) {
			error = 'Rig name is required';
			return;
		}
		if (nameError) {
			error = nameError;
			return;
		}
		if (!gitUrl.trim()) {
			error = 'Git URL is required';
			return;
		}
		if (urlError) {
			error = urlError;
			return;
		}

		error = null;
		isLoading = true;

		try {
			await api.addRig({
				name: name.trim(),
				gitUrl: gitUrl.trim(),
				branch: branch.trim() || undefined,
				prefix: prefix.trim() || undefined
			});
			await rigsStore.fetch();
			onCancel();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add rig';
		} finally {
			isLoading = false;
		}
	}
</script>

<Card title="Add Rig">
	<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<Input
			bind:value={name}
			label="Name"
			placeholder="e.g., my-rig"
			required
			error={nameError ?? undefined}
			disabled={isLoading}
		/>

		<Input
			bind:value={gitUrl}
			label="Git URL"
			placeholder="e.g., https://github.com/org/repo.git"
			required
			error={urlError ?? undefined}
			disabled={isLoading}
		/>

		<Input
			bind:value={branch}
			label="Branch"
			placeholder="optional (defaults to main)"
			disabled={isLoading}
		/>

		<Input
			bind:value={prefix}
			label="Prefix"
			placeholder="optional"
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
				<Plus size={14} />
				{isLoading ? 'Adding...' : 'Add Rig'}
			</Button>
		</div>
	</form>
</Card>
