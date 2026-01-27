<script lang="ts">
	import { Send, Radio, AlertTriangle, X } from 'lucide-svelte';

	interface AgentOption {
		name: string;
		address: string;
	}

	interface Props {
		agents: AgentOption[];
		onclose: () => void;
	}

	let { agents, onclose }: Props = $props();

	let isBroadcast = $state(false);
	let selectedAgent = $state('');
	let message = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	// Validation constants
	const MAX_MESSAGE_LENGTH = 500;

	// Validation state
	const messageLength = $derived(message.length);
	const isMessageTooLong = $derived(messageLength > MAX_MESSAGE_LENGTH);
	const isValid = $derived(
		message.trim().length > 0 &&
		!isMessageTooLong &&
		(isBroadcast || selectedAgent.length > 0)
	);

	async function handleSubmit() {
		if (!isValid || isSubmitting) return;

		isSubmitting = true;
		error = null;
		success = null;

		try {
			const url = isBroadcast ? '/api/gastown/agents/broadcast' : '/api/gastown/agents/nudge';
			const body = isBroadcast
				? { message: message.trim() }
				: { agent: selectedAgent, message: message.trim() };

			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to send';
				return;
			}

			success = isBroadcast ? 'Broadcast sent to all workers' : `Nudge sent to ${selectedAgent}`;
			message = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="p-4 rounded-sm bg-oil-800 border border-oil-700 space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100 flex items-center gap-2">
			{#if isBroadcast}
				<Radio size={16} class="text-rust-400" />
				Broadcast
			{:else}
				<Send size={16} class="text-rust-400" />
				Nudge Agent
			{/if}
		</h3>
		<button class="text-chrome-500 hover:text-chrome-300" onclick={onclose}>
			<X size={16} />
		</button>
	</div>

	<!-- Mode Toggle -->
	<div class="flex items-center gap-2">
		<button
			class="px-3 py-1.5 rounded-sm font-mono text-xs uppercase transition-all
				{!isBroadcast
					? 'bg-rust-600/20 text-rust-400 border border-rust-500'
					: 'bg-oil-900 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
			onclick={() => isBroadcast = false}
		>
			Nudge
		</button>
		<button
			class="px-3 py-1.5 rounded-sm font-mono text-xs uppercase transition-all
				{isBroadcast
					? 'bg-rust-600/20 text-rust-400 border border-rust-500'
					: 'bg-oil-900 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
			onclick={() => isBroadcast = true}
		>
			Broadcast
		</button>
	</div>

	{#if error}
		<div class="px-3 py-2 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
			<AlertTriangle size={14} />
			<span>{error}</span>
		</div>
	{/if}

	{#if success}
		<div class="px-3 py-2 rounded-sm bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
			{success}
		</div>
	{/if}

	{#if !isBroadcast}
		<div>
			<label for="nudge-agent" class="block text-xs font-stencil uppercase text-chrome-400 mb-1">Agent</label>
			<select
				id="nudge-agent"
				bind:value={selectedAgent}
				class="w-full px-3 py-2 bg-oil-900 border border-oil-700 rounded-sm text-sm font-mono text-chrome-200 focus:border-rust-500 focus:outline-none"
			>
				<option value="">Select agent...</option>
				{#each agents as agent}
					<option value={agent.address || agent.name}>{agent.name} ({agent.address})</option>
				{/each}
			</select>
		</div>
	{/if}

	<div>
		<div class="flex items-center justify-between mb-1">
			<label for="nudge-message" class="block text-xs font-stencil uppercase text-chrome-400">Message</label>
			<span class="text-xs font-mono {isMessageTooLong ? 'text-rust-400' : 'text-chrome-500'}">
				{messageLength} / {MAX_MESSAGE_LENGTH}
			</span>
		</div>
		<textarea
			id="nudge-message"
			bind:value={message}
			placeholder={isBroadcast ? 'Message to all workers...' : 'Message to agent...'}
			rows="3"
			class="w-full px-3 py-2 bg-oil-900 border border-oil-700 rounded-sm text-sm font-mono text-chrome-200 placeholder-chrome-600 focus:border-rust-500 focus:outline-none resize-none"
		></textarea>
		{#if isMessageTooLong}
			<p class="text-xs text-rust-400 mt-1">Message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters</p>
		{/if}
	</div>

	<div class="flex justify-end">
		<button
			class="flex items-center gap-2 px-4 py-2 rounded-sm font-stencil text-xs uppercase tracking-wider transition-all
				{isValid && !isSubmitting
					? 'bg-rust-600 text-white hover:bg-rust-500'
					: 'bg-oil-900 text-chrome-600 cursor-not-allowed'}"
			disabled={!isValid || isSubmitting}
			onclick={handleSubmit}
		>
			{#if isBroadcast}
				<Radio size={14} />
				{isSubmitting ? 'Sending...' : 'Broadcast'}
			{:else}
				<Send size={14} />
				{isSubmitting ? 'Sending...' : 'Send Nudge'}
			{/if}
		</button>
	</div>
</div>
