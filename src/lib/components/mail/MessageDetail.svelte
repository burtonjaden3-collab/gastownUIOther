<script lang="ts">
	import { Reply, Archive, CheckCheck, ArrowLeft } from 'lucide-svelte';
	import { Card, Button, Badge } from '$lib/components/core';
	import type { MailMessage, MailSource } from '$lib/stores/mail.svelte';
	import { SOURCE_LABELS, CATEGORY_LABELS } from '$lib/stores/mail.svelte';

	interface Props {
		message: MailMessage;
		onReply: () => void;
		onArchive: (id: string) => Promise<void>;
		onMarkRead: (id: string) => Promise<void>;
		onBack: () => void;
	}

	let { message, onReply, onArchive, onMarkRead, onBack }: Props = $props();

	let isArchiving = $state(false);
	let isMarkingRead = $state(false);
	let error = $state<string | null>(null);

	// Priority badge variant mapping
	const priorityVariants: Record<number, { variant: 'danger' | 'warning' | 'rust' | 'chrome'; label: string }> = {
		0: { variant: 'danger', label: 'URGENT' },
		1: { variant: 'warning', label: 'HIGH' },
		2: { variant: 'rust', label: 'NORMAL' },
		3: { variant: 'chrome', label: 'LOW' }
	};

	// Source badge variant mapping
	const sourceVariants: Record<MailSource, 'rust' | 'warning' | 'chrome'> = {
		witness: 'rust',
		deacon: 'warning',
		dog: 'chrome'
	};

	const priorityConfig = $derived(priorityVariants[message.priority] || priorityVariants[2]);
	const sourceVariant = $derived(sourceVariants[message.source]);
	const sourceLabel = $derived(SOURCE_LABELS[message.source]);
	const categoryLabel = $derived(CATEGORY_LABELS[message.category]);

	async function handleArchive() {
		isArchiving = true;
		error = null;
		try {
			await onArchive(message.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to archive message';
		} finally {
			isArchiving = false;
		}
	}

	async function handleMarkRead() {
		isMarkingRead = true;
		error = null;
		try {
			await onMarkRead(message.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to mark as read';
		} finally {
			isMarkingRead = false;
		}
	}
</script>

<div class="space-y-4">
	<!-- Back button -->
	<Button variant="ghost" size="sm" onclick={onBack}>
		<ArrowLeft size={14} />
		Back to inbox
	</Button>

	<Card>
		{#snippet headerContent()}
			<div class="w-full space-y-3">
				<h2 class="font-stencil text-2xl uppercase tracking-wider text-chrome-100">
					{message.subject}
				</h2>
				<div class="flex items-center gap-3 text-sm">
					<span class="font-mono text-chrome-500">From:</span>
					<span class="font-mono text-rust-400">{message.from}</span>
					{#if message.rigName}
						<span class="text-chrome-700">/</span>
						<span class="font-mono text-chrome-400">{message.rigName}</span>
					{/if}
					<span class="text-chrome-700">-&gt;</span>
					<span class="font-mono text-chrome-500">To:</span>
					<span class="font-mono text-chrome-300">{message.to}</span>
				</div>
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-xs text-chrome-500 font-mono">{message.createdAt}</span>
					<span class="text-chrome-700">-</span>
					<Badge variant={priorityConfig.variant}>
						{priorityConfig.label}
					</Badge>
					<Badge variant={sourceVariant}>
						{sourceLabel}
					</Badge>
					<Badge variant="default">
						{categoryLabel}
					</Badge>
					{#each message.labels as label}
						<Badge variant="chrome">{label}</Badge>
					{/each}
				</div>
			</div>
		{/snippet}

		<!-- Message body -->
		<div class="p-4 bg-oil-950 border border-oil-700 rounded-sm">
			<pre class="font-mono text-sm text-chrome-200 whitespace-pre-wrap">{message.body}</pre>
		</div>

		<!-- Error message -->
		{#if error}
			<div class="p-3 bg-red-900/20 border border-red-700 rounded-sm">
				<p class="text-sm text-red-400">{error}</p>
			</div>
		{/if}

		{#snippet footer()}
			<div class="flex gap-2">
				<Button onclick={onReply}>
					<Reply size={14} />
					Reply
				</Button>
				<Button variant="secondary" onclick={handleArchive} disabled={isArchiving}>
					<Archive size={14} />
					{isArchiving ? 'Archiving...' : 'Archive'}
				</Button>
				<Button variant="ghost" onclick={handleMarkRead} disabled={isMarkingRead}>
					<CheckCheck size={14} />
					{isMarkingRead ? 'Marking...' : 'Mark Read'}
				</Button>
			</div>
		{/snippet}
	</Card>
</div>
