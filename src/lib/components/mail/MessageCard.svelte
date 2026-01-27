<script lang="ts">
	import { Mail, MailOpen } from 'lucide-svelte';
	import type { MailSource, MailCategory } from '$lib/stores/mail.svelte';
	import { SOURCE_LABELS, CATEGORY_LABELS } from '$lib/stores/mail.svelte';

	interface Props {
		id: string;
		subject: string;
		from: string;
		preview: string;
		createdAt: string;
		isUnread: boolean;
		priority: number;
		source: MailSource;
		category: MailCategory;
		rigName?: string;
		onclick?: () => void;
		class?: string;
	}

	let {
		id,
		subject,
		from,
		preview,
		createdAt,
		isUnread,
		priority,
		source,
		category,
		rigName,
		onclick,
		class: className = ''
	}: Props = $props();

	// Priority color mapping (left border)
	const priorityColors: Record<number, string> = {
		0: 'border-l-red-500',     // urgent
		1: 'border-l-flame-500',   // high
		2: 'border-l-rust-500',    // normal
		3: 'border-l-chrome-500'   // low
	};

	// Source color mapping (badge)
	const sourceColors: Record<MailSource, string> = {
		witness: 'bg-rust-900/50 text-rust-300 border-rust-700',
		deacon: 'bg-warning-900/50 text-warning-300 border-warning-700',
		dog: 'bg-chrome-800/50 text-chrome-200 border-chrome-600'
	};

	const borderColor = $derived(priorityColors[priority] || priorityColors[2]);
	const MailIcon = $derived(isUnread ? Mail : MailOpen);
	const sourceLabel = $derived(SOURCE_LABELS[source]);
	const categoryLabel = $derived(CATEGORY_LABELS[category]);
	const sourceStyle = $derived(sourceColors[source]);
</script>

<button
	class="w-full text-left p-4 bg-oil-900 border border-oil-700 border-l-4 {borderColor} rounded-sm
		hover:bg-oil-800 hover:border-oil-600 transition-all duration-150
		focus:outline-none focus:ring-2 focus:ring-rust-500 focus:ring-offset-2 focus:ring-offset-oil-950
		{className}"
	{onclick}
>
	<div class="flex items-start gap-3">
		<!-- Mail icon -->
		<div class="mt-0.5">
			<MailIcon
				size={16}
				class={isUnread ? 'text-rust-400' : 'text-chrome-500'}
			/>
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				{#if isUnread}
					<div class="w-2 h-2 rounded-full bg-rust-500"></div>
				{/if}
				<span
					class="font-mono text-xs {isUnread
						? 'text-rust-400 font-semibold'
						: 'text-chrome-500'}"
				>
					{from}
				</span>
				{#if rigName}
					<span class="text-chrome-700">/</span>
					<span class="font-mono text-xs text-chrome-600">{rigName}</span>
				{/if}
			</div>

			<h4
				class="font-mono text-sm {isUnread
					? 'text-chrome-100 font-semibold'
					: 'text-chrome-300'} truncate mb-1"
			>
				{subject}
			</h4>

			<p class="text-xs text-chrome-500 truncate">{preview}</p>

			<div class="flex items-center gap-2 mt-2">
				<!-- Source badge -->
				<span class="inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide border rounded-sm {sourceStyle}">
					{sourceLabel}
				</span>
				<!-- Category -->
				<span class="font-mono text-[10px] text-chrome-600 uppercase">{categoryLabel}</span>
				<span class="text-chrome-700">P{priority}</span>
			</div>
		</div>

		<!-- Timestamp -->
		<div class="text-xs text-chrome-500 font-mono whitespace-nowrap">
			{createdAt}
		</div>
	</div>
</button>
