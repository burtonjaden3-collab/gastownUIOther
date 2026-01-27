<script lang="ts">
	import { Loader2, X } from 'lucide-svelte';
	import Button from './Button.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		confirmLabel?: string;
		confirmVariant?: 'primary' | 'danger' | 'warning';
		cancelLabel?: string;
		isLoading?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
		children?: Snippet;
	}

	let {
		open,
		title,
		description,
		confirmLabel = 'Confirm',
		confirmVariant = 'primary',
		cancelLabel = 'Cancel',
		isLoading = false,
		onConfirm,
		onCancel,
		children
	}: Props = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			onCancel();
		}
	}

	function handleCancel(e: Event) {
		e.preventDefault();
		onCancel();
	}
</script>

<dialog
	bind:this={dialogEl}
	oncancel={handleCancel}
	onclick={handleBackdropClick}
	class="backdrop:bg-black/60 bg-transparent p-0 m-auto"
>
	<div class="bg-oil-900 border border-oil-700 rounded-sm w-[28rem] max-w-[90vw] shadow-xl">
		<div class="flex items-center justify-between px-5 py-4 border-b border-oil-700">
			<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-200">{title}</h2>
			<button
				class="text-chrome-500 hover:text-chrome-300 transition-colors"
				onclick={onCancel}
				aria-label="Close"
				disabled={isLoading}
			>
				<X size={18} />
			</button>
		</div>

		<div class="px-5 py-4 space-y-3">
			{#if description}
				<p class="text-sm text-chrome-400">{description}</p>
			{/if}
			{#if children}
				{@render children()}
			{/if}
		</div>

		<div class="flex items-center justify-end gap-3 px-5 py-4 border-t border-oil-700">
			<Button variant="ghost" size="sm" onclick={onCancel} disabled={isLoading}>
				{cancelLabel}
			</Button>
			<Button variant={confirmVariant} size="sm" onclick={onConfirm} disabled={isLoading}>
				{#if isLoading}
					<Loader2 size={14} class="animate-spin" />
				{/if}
				{confirmLabel}
			</Button>
		</div>
	</div>
</dialog>
