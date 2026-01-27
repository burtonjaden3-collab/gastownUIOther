<!-- src/routes/messages/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { Button, Badge } from '$lib/components/core';
	import { MessageCard, ComposeForm, MessageDetail } from '$lib/components/mail';
	import { mailStore, SOURCE_LABELS, type MailSource } from '$lib/stores/mail.svelte';
	import { PlusCircle, RefreshCw, Mail } from 'lucide-svelte';

	onMount(() => {
		mailStore.fetch();
	});

	// Component state
	let showCompose = $state(false);
	let replyTo = $state<{ id: string; from: string; subject: string } | null>(null);
	let filter = $state<'all' | 'unread' | 'witness' | 'deacon' | 'dog'>('all');

	// Filtered messages
	const filteredMessages = $derived.by(() => {
		switch (filter) {
			case 'unread':
				return mailStore.items.filter((m) => m.status === 'unread');
			case 'witness':
				return mailStore.bySource('witness');
			case 'deacon':
				return mailStore.bySource('deacon');
			case 'dog':
				return mailStore.bySource('dog');
			default:
				return mailStore.items;
		}
	});

	// Source counts
	const witnessMail = $derived(mailStore.bySource('witness').length);
	const deaconMail = $derived(mailStore.bySource('deacon').length);
	const dogMail = $derived(mailStore.bySource('dog').length);

	// Handlers
	async function handleSend(
		to: string,
		subject: string,
		body: string,
		opts?: { type?: string; priority?: number }
	) {
		await mailStore.send(to, subject, body, opts);
		showCompose = false;
		replyTo = null;
	}

	function handleReply() {
		const selected = mailStore.selected;
		if (selected) {
			replyTo = {
				id: selected.id,
				from: selected.from,
				subject: selected.subject.startsWith('Re:') ? selected.subject : `Re: ${selected.subject}`
			};
			showCompose = true;
		}
	}

	async function handleArchive(id: string) {
		await mailStore.archive(id);
	}

	async function handleMarkRead(id: string) {
		await mailStore.markRead(id);
	}

	async function handleSelect(id: string) {
		mailStore.select(id);
		showCompose = false;
		replyTo = null;

		const selected = mailStore.items.find((m) => m.id === id);
		if (selected && selected.status === 'unread') {
			await mailStore.markRead(id);
		}
	}

	function handleCompose() {
		showCompose = true;
		replyTo = null;
		mailStore.select(null);
	}

	function handleCancelCompose() {
		showCompose = false;
		replyTo = null;
	}

	function handleRefresh() {
		mailStore.fetch();
	}

	function handleBack() {
		mailStore.select(null);
	}

	type FilterKey = typeof filter;
	const filterButtons: { key: FilterKey; label: string; count?: () => number }[] = [
		{ key: 'all', label: 'All', count: () => mailStore.items.length },
		{ key: 'unread', label: 'Unread', count: () => mailStore.unreadCount },
		{ key: 'witness', label: 'Witness', count: () => witnessMail },
		{ key: 'deacon', label: 'Deacon', count: () => deaconMail },
		{ key: 'dog', label: 'Dog', count: () => dogMail }
	];
</script>

<svelte:head>
	<title>Messages | Gas Town</title>
</svelte:head>

<Header title="Messages" subtitle="Mayor's escalation inbox" onRefresh={handleRefresh} />

<div class="flex h-[calc(100vh-theme(spacing.16))]">
	<!-- Inbox Panel (Left) -->
	<div class="w-96 flex-shrink-0 border-r border-oil-700 bg-oil-900 flex flex-col">
		<!-- Inbox Header -->
		<div class="p-4 border-b border-oil-700">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<Mail size={20} class="text-rust-400" />
					<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-100">Inbox</h2>
					{#if mailStore.unreadCount > 0}
						<Badge variant="danger">{mailStore.unreadCount}</Badge>
					{/if}
				</div>
				<Button variant="primary" size="sm" onclick={handleCompose}>
					<PlusCircle size={16} />
					<span>Compose</span>
				</Button>
			</div>

			<!-- Filters -->
			<div class="flex items-center gap-1.5 flex-wrap">
				{#each filterButtons as fb}
					<button
						class="px-2.5 py-1 rounded-sm font-mono text-xs uppercase transition-all
							{filter === fb.key
								? 'bg-rust-600/20 text-rust-400 border border-rust-500'
								: 'bg-oil-800 text-chrome-400 border border-oil-700 hover:border-oil-600'}"
						onclick={() => (filter = fb.key)}
					>
						{fb.label}
						{#if fb.count}
							<span class="ml-1 text-chrome-500">({fb.count()})</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Message List -->
		<div class="flex-1 overflow-y-auto">
			{#if mailStore.isLoading}
				<div class="flex items-center justify-center py-12">
					<RefreshCw size={24} class="text-chrome-500 animate-spin" />
				</div>
			{:else if mailStore.error}
				<div class="p-4 text-center">
					<p class="text-red-400 font-mono text-sm">{mailStore.error}</p>
					<Button variant="secondary" size="sm" onclick={handleRefresh} class="mt-2">
						<RefreshCw size={14} />
						<span>Retry</span>
					</Button>
				</div>
			{:else if filteredMessages.length === 0}
				<div class="p-4 text-center py-12">
					<p class="text-chrome-500 font-mono text-sm mb-2">
						{filter === 'all' ? 'No messages' : `No ${filter} messages`}
					</p>
					{#if filter !== 'all'}
						<button
							class="text-rust-400 hover:text-rust-300 text-xs font-mono"
							onclick={() => (filter = 'all')}
						>
							View all messages -&gt;
						</button>
					{/if}
				</div>
			{:else}
				<div class="divide-y divide-oil-800">
					{#each filteredMessages as message (message.id)}
						<MessageCard
							id={message.id}
							subject={message.subject}
							from={message.from}
							preview={message.body.slice(0, 100)}
							createdAt={new Date(message.createdAt).toLocaleString()}
							isUnread={message.status === 'unread'}
							priority={message.priority}
							source={message.source}
							category={message.category}
							rigName={message.rigName}
							onclick={() => handleSelect(message.id)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Detail Panel (Right) -->
	<div class="flex-1 overflow-y-auto bg-oil-950">
		{#if showCompose}
			<div class="p-6">
				<ComposeForm onSend={handleSend} onCancel={handleCancelCompose} replyTo={replyTo ?? undefined} />
			</div>
		{:else if mailStore.selectedId && mailStore.selected}
			<div class="p-6">
				<MessageDetail
					message={mailStore.selected}
					onReply={handleReply}
					onArchive={handleArchive}
					onMarkRead={handleMarkRead}
					onBack={handleBack}
				/>
			</div>
		{:else}
			<div class="h-full flex items-center justify-center">
				<div class="text-center">
					<Mail size={48} class="text-chrome-600 mx-auto mb-4" />
					<p class="text-chrome-500 font-mono">Select a message to read</p>
				</div>
			</div>
		{/if}
	</div>
</div>
