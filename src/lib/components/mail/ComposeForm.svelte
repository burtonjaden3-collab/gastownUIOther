<script lang="ts">
	import { Send, X } from 'lucide-svelte';
	import { Card, Button, Input, Select, Textarea } from '$lib/components/core';

	interface Props {
		onSend: (
			to: string,
			subject: string,
			body: string,
			opts?: { type?: string; priority?: number }
		) => Promise<void>;
		onCancel: () => void;
		replyTo?: { id: string; from: string; subject: string };
	}

	let { onSend, onCancel, replyTo }: Props = $props();

	let to = $state('');
	let subject = $state('');
	let body = $state('');

	$effect(() => {
		to = replyTo?.from || '';
		subject = replyTo ? `Re: ${replyTo.subject}` : '';
	});
	let type = $state('notification');
	let priority = $state('2');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const isReply = $derived(!!replyTo);

	const typeOptions = [
		{ value: 'notification', label: 'Notification' },
		{ value: 'task', label: 'Task' },
		{ value: 'reply', label: 'Reply' }
	];

	const priorityOptions = [
		{ value: '0', label: 'Urgent (P0)' },
		{ value: '1', label: 'High (P1)' },
		{ value: '2', label: 'Normal (P2)' },
		{ value: '3', label: 'Low (P3)' }
	];

	async function handleSubmit() {
		if (!to.trim()) {
			error = 'Recipient is required';
			return;
		}
		if (!subject.trim()) {
			error = 'Subject is required';
			return;
		}
		if (!body.trim()) {
			error = 'Message body is required';
			return;
		}

		error = null;
		isLoading = true;

		try {
			const opts = isReply ? undefined : { type, priority: Number(priority) };
			await onSend(to.trim(), subject.trim(), body.trim(), opts);
			if (!replyTo) {
				to = '';
				subject = '';
				body = '';
				type = 'notification';
				priority = '2';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send message';
		} finally {
			isLoading = false;
		}
	}
</script>

<Card title={isReply ? `Reply to ${replyTo?.from}` : 'Compose Message'}>
	<form class="space-y-4" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<!-- To field -->
		<Input
			label="To"
			bind:value={to}
			placeholder="agent name or address"
			disabled={isReply}
			required
		/>

		<!-- Subject field -->
		<Input
			label="Subject"
			bind:value={subject}
			placeholder="message subject"
			required
		/>

		<!-- Body field -->
		<Textarea
			label="Message"
			bind:value={body}
			placeholder="write your message here..."
			rows={8}
			required
		/>

		<!-- Type and Priority (hidden for replies) -->
		{#if !isReply}
			<div class="grid grid-cols-2 gap-4">
				<Select
					label="Type"
					bind:value={type}
					options={typeOptions}
				/>

				<Select
					label="Priority"
					bind:value={priority}
					options={priorityOptions}
				/>
			</div>
		{/if}

		<!-- Error message -->
		{#if error}
			<div class="p-3 bg-red-900/20 border border-red-700 rounded-sm">
				<p class="text-sm text-red-400">{error}</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex gap-2 pt-2">
			<Button type="button" variant="ghost" onclick={onCancel} disabled={isLoading}>
				<X size={14} />
				Cancel
			</Button>
			<Button type="submit" disabled={isLoading}>
				<Send size={14} />
				{isLoading ? 'Sending...' : 'Send'}
			</Button>
		</div>
	</form>
</Card>
