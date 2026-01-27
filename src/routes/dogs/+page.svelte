<script lang="ts">
	import { Header } from '$lib/components/layout';
	import { Card, Button } from '$lib/components/core';
	import { DogCard } from '$lib/components/dogs';
	import { dogsStore } from '$lib/stores/dogs.svelte';
	import { AlertTriangle, RefreshCw, Dog, Plus, X, ServerCrash } from 'lucide-svelte';

	$effect(() => { dogsStore.fetch(); });

	let showAddDog = $state(false);
	let selectedName = $state('');
	let showRepoError = $state(false);

	const repoErrorRig = $derived.by(() => {
		const err = dogsStore.error;
		if (!err) return null;
		const match = err.match(/creating worktree for rig (\S+):.*no repo base found/);
		return match ? match[1] : null;
	});

	$effect(() => {
		if (repoErrorRig) {
			showRepoError = true;
		}
	});

	async function handleAdd() {
		if (!selectedName) return;
		await dogsStore.addDog(selectedName);
		showAddDog = false;
		selectedName = '';
	}

	function handleRemove(name: string) {
		dogsStore.removeDog(name);
	}

	const stats = $derived(dogsStore.stats);
</script>

<svelte:head>
	<title>Dogs | Gas Town</title>
</svelte:head>

<Header
	title="Dog Pool"
	subtitle="{stats.total} dogs"
	onRefresh={() => dogsStore.fetch()}
/>

{#if dogsStore.error}
	{@const rigName = repoErrorRig}
	{#if rigName}
		<button
			class="mx-6 mt-4 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono flex items-center gap-2 w-[calc(100%-3rem)] text-left hover:bg-red-500/15 transition-colors cursor-pointer"
			onclick={() => showRepoError = true}
		>
			<ServerCrash size={16} class="flex-shrink-0" />
			<span>Rig <strong class="text-red-300">{rigName}</strong> is missing its repo base — click for details</span>
		</button>
	{:else}
		<div class="mx-6 mt-4 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono flex items-center gap-2">
			<AlertTriangle size={16} class="flex-shrink-0" />
			<span>{dogsStore.error}</span>
		</div>
	{/if}
{/if}

<!-- Repo Base Error Dialog -->
{#if showRepoError && repoErrorRig}
	{@const rigName = repoErrorRig}
	<dialog
		open
		class="fixed inset-0 z-50 bg-transparent p-0 m-auto"
	>
		<div
			class="fixed inset-0 bg-black/60"
			onclick={() => showRepoError = false}
			onkeydown={(e) => e.key === 'Escape' && (showRepoError = false)}
			role="button"
			tabindex="-1"
		></div>
		<div class="fixed inset-0 flex items-center justify-center pointer-events-none">
			<div class="bg-oil-900 border border-oil-700 rounded-sm w-[32rem] max-w-[90vw] shadow-xl pointer-events-auto">
				<div class="flex items-center justify-between px-5 py-4 border-b border-oil-700">
					<div class="flex items-center gap-2">
						<ServerCrash size={18} class="text-red-400" />
						<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-200">Rig Not Initialized</h2>
					</div>
					<button
						class="text-chrome-500 hover:text-chrome-300 transition-colors"
						onclick={() => showRepoError = false}
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				<div class="px-5 py-4 space-y-4">
					<p class="text-sm text-chrome-300">
						Dogs need a git worktree for every configured rig. The rig
						<strong class="text-rust-400">{rigName}</strong>
						is missing its repository base.
					</p>

					<div class="space-y-2">
						<p class="text-xs font-stencil uppercase tracking-wider text-chrome-500">What this means</p>
						<p class="text-sm text-chrome-400">
							Each dog creates a worktree per rig so it can perform cross-project infrastructure work
							(cleanup, orphan scanning, etc.). The rig needs either a <code class="text-rust-400 bg-oil-800 px-1 rounded">.repo.git</code>
							bare repository or a <code class="text-rust-400 bg-oil-800 px-1 rounded">mayor/rig</code> directory to branch from.
						</p>
					</div>

					<div class="space-y-2">
						<p class="text-xs font-stencil uppercase tracking-wider text-chrome-500">How to fix</p>
						<p class="text-sm text-chrome-400">
							Re-add the rig through the CLI so it sets up the proper repo structure:
						</p>
						<div class="bg-oil-950 border border-oil-700 rounded-sm px-3 py-2">
							<code class="text-xs font-mono text-flame-400">gt rig add {rigName} &lt;git-url&gt;</code>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-end px-5 py-4 border-t border-oil-700">
					<Button variant="primary" size="sm" onclick={() => showRepoError = false}>
						Got It
					</Button>
				</div>
			</div>
		</div>
	</dialog>
{/if}

<div class="p-6 space-y-6">
	<!-- Stats -->
	<div class="grid grid-cols-4 gap-4">
		<Card>
			<div class="text-center">
				<p class="text-3xl font-stencil text-chrome-100">{stats.total}</p>
				<p class="text-xs font-mono uppercase text-chrome-500">Total</p>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<p class="text-3xl font-stencil text-chrome-400">{stats.idle}</p>
				<p class="text-xs font-mono uppercase text-chrome-500">Idle</p>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<p class="text-3xl font-stencil text-green-400">{stats.working}</p>
				<p class="text-xs font-mono uppercase text-chrome-500">Working</p>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<p class="text-3xl font-stencil text-red-400">{stats.stuck}</p>
				<p class="text-xs font-mono uppercase text-chrome-500">Stuck</p>
			</div>
		</Card>
	</div>

	<!-- Add Dog -->
	<div class="flex items-center gap-3">
		{#if showAddDog && dogsStore.canAddDog}
			<select
				bind:value={selectedName}
				class="px-3 py-2 bg-oil-900 border border-oil-700 rounded-sm text-sm font-mono text-chrome-200 focus:border-rust-500 focus:outline-none"
			>
				<option value="">Select name...</option>
				{#each dogsStore.availableNames as name}
					<option value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
				{/each}
			</select>
			<button
				class="px-4 py-2 rounded-sm font-stencil text-xs uppercase tracking-wider bg-rust-600 text-white hover:bg-rust-500 disabled:opacity-50"
				disabled={!selectedName || dogsStore.isLoading}
				onclick={handleAdd}
			>
				Spawn
			</button>
			<button
				class="text-xs font-mono text-chrome-400 hover:text-chrome-200"
				onclick={() => { showAddDog = false; selectedName = ''; }}
			>
				Cancel
			</button>
		{:else}
			<button
				class="flex items-center gap-2 px-4 py-2 rounded-sm font-stencil text-xs uppercase tracking-wider bg-rust-600/20 text-rust-400 border border-rust-500/50 hover:bg-rust-600/30 transition-all disabled:opacity-50"
				disabled={!dogsStore.canAddDog || dogsStore.isLoading}
				onclick={() => showAddDog = true}
			>
				<Plus size={14} />
				Add Dog
			</button>
			{#if !dogsStore.canAddDog && stats.total >= 4}
				<span class="text-[10px] font-mono text-chrome-500">Max 4 dogs</span>
			{/if}
		{/if}
	</div>

	<!-- Dog Grid -->
	{#if dogsStore.isLoading && dogsStore.items.length === 0}
		<Card>
			<div class="text-center py-12">
				<RefreshCw size={24} class="text-chrome-500 animate-spin mx-auto mb-3" />
				<p class="text-chrome-500 font-mono">Loading dogs...</p>
			</div>
		</Card>
	{:else if dogsStore.items.length === 0}
		<Card>
			<div class="text-center py-12">
				<Dog size={32} class="text-oil-700 mx-auto mb-3" />
				<p class="text-chrome-500 font-mono text-sm">No dogs in pool</p>
			</div>
		</Card>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
			{#each dogsStore.items as dog (dog.name)}
				<DogCard
					name={dog.name}
					status={dog.status}
					currentTask={dog.currentTask}
					duration={dog.duration}
					onremove={handleRemove}
				/>
			{/each}
		</div>
	{/if}
</div>
