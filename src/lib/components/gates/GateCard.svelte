<script lang="ts">
	import { Clock, GitBranch, User, Mail, Timer, X } from 'lucide-svelte';

	interface Props {
		id: string;
		awaitType: 'timer' | 'gh:run' | 'gh:pr' | 'human' | 'mail';
		status: 'open' | 'closed';
		createdAt: string;
		timeout?: string;
		waiters: string[];
		onclose?: (id: string, reason: string) => void;
	}

	let { id, awaitType, status, createdAt, timeout, waiters, onclose }: Props = $props();

	let showCloseInput = $state(false);
	let closeReason = $state('');

	const typeConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
		timer: { icon: Timer, label: 'Timer', color: 'text-chrome-400' },
		'gh:run': { icon: GitBranch, label: 'GitHub Run', color: 'text-purple-400' },
		'gh:pr': { icon: GitBranch, label: 'GitHub PR', color: 'text-purple-400' },
		human: { icon: User, label: 'Human', color: 'text-warning-400' },
		mail: { icon: Mail, label: 'Mail', color: 'text-blue-400' }
	};

	const config = $derived(typeConfig[awaitType] || typeConfig.timer);
	const Icon = $derived(config.icon);
	const isOpen = $derived(status === 'open');
	const canClose = $derived(isOpen && (awaitType === 'human' || awaitType === 'mail'));

	function handleClose() {
		if (closeReason.trim() && onclose) {
			onclose(id, closeReason.trim());
			showCloseInput = false;
			closeReason = '';
		}
	}
</script>

<div class="p-4 rounded-sm bg-oil-800 border {isOpen ? 'border-warning-500/50' : 'border-oil-700'}">
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-2">
			<div class="w-8 h-8 rounded-sm flex items-center justify-center {isOpen ? 'bg-warning-500/10' : 'bg-green-500/10'}">
				<Icon size={16} class={config.color} />
			</div>
			<div>
				<p class="font-mono text-sm text-chrome-100">{config.label}</p>
				<p class="text-[10px] font-mono text-chrome-600">{id}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if isOpen}
				<span class="w-2 h-2 rounded-full bg-warning-500 animate-pulse"></span>
				<span class="text-[10px] font-mono uppercase text-warning-400">Open</span>
			{:else}
				<span class="w-2 h-2 rounded-full bg-green-500"></span>
				<span class="text-[10px] font-mono uppercase text-green-400">Closed</span>
			{/if}
		</div>
	</div>

	<div class="mt-3 flex items-center gap-4 text-[10px] font-mono text-chrome-500">
		<span>Created: {new Date(createdAt).toLocaleString()}</span>
		{#if timeout}<span>Timeout: {timeout}</span>{/if}
	</div>

	{#if waiters.length > 0}
		<div class="mt-2 flex flex-wrap gap-1">
			{#each waiters as waiter}
				<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-oil-900 text-chrome-400">{waiter}</span>
			{/each}
		</div>
	{/if}

	{#if canClose}
		{#if showCloseInput}
			<div class="mt-3 pt-3 border-t border-oil-700 space-y-2">
				<input
					type="text"
					bind:value={closeReason}
					placeholder="Reason for closing..."
					class="w-full px-2 py-1.5 bg-oil-900 border border-oil-700 rounded-sm text-xs font-mono text-chrome-200 placeholder-chrome-600 focus:border-rust-500 focus:outline-none"
				/>
				<div class="flex gap-2">
					<button
						class="px-3 py-1 rounded-sm text-[10px] font-stencil uppercase bg-rust-600 text-white hover:bg-rust-500 disabled:opacity-50"
						disabled={!closeReason.trim()}
						onclick={handleClose}
					>
						Close Gate
					</button>
					<button
						class="px-3 py-1 rounded-sm text-[10px] font-stencil uppercase text-chrome-400 hover:text-chrome-200"
						onclick={() => { showCloseInput = false; closeReason = ''; }}
					>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<button
				class="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-rust-400 hover:text-rust-300"
				onclick={() => showCloseInput = true}
			>
				<X size={10} />
				Close Gate
			</button>
		{/if}
	{/if}
</div>
