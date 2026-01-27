<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	const textarea = tv({
		slots: {
			wrapper: 'flex flex-col gap-1.5',
			label: 'font-stencil text-sm uppercase tracking-wider text-chrome-400',
			field: [
				'w-full px-3 py-2 bg-oil-950 border-2 border-oil-700 rounded-sm',
				'font-mono text-sm text-chrome-100 placeholder:text-chrome-600',
				'transition-all duration-150 resize-y min-h-[100px]',
				'hover:border-oil-600',
				'focus:outline-none focus:border-rust-500 focus:ring-1 focus:ring-rust-500/50',
				'disabled:opacity-50 disabled:cursor-not-allowed'
			],
			hint: 'text-xs text-chrome-500',
			error: 'text-xs text-red-400'
		},
		variants: {
			hasError: {
				true: {
					field: 'border-red-600 focus:border-red-500 focus:ring-red-500/50'
				}
			}
		},
		defaultVariants: {
			hasError: false
		}
	});

	interface Props {
		id?: string;
		name?: string;
		value?: string;
		placeholder?: string;
		label?: string;
		hint?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		rows?: number;
		class?: string;
		oninput?: (e: Event) => void;
	}

	let {
		id,
		name,
		value = $bindable(''),
		placeholder,
		label,
		hint,
		error,
		disabled = false,
		required = false,
		rows = 4,
		class: className = '',
		oninput
	}: Props = $props();

	const hasError = $derived(!!error);
	const styles = $derived(textarea({ hasError }));
</script>

<div class={styles.wrapper({ class: className })}>
	{#if label}
		<label for={id} class={styles.label()}>
			{label}
			{#if required}
				<span class="text-rust-500">*</span>
			{/if}
		</label>
	{/if}

	<textarea
		{id}
		{name}
		bind:value
		{placeholder}
		{disabled}
		{required}
		{rows}
		class={styles.field()}
		{oninput}
	></textarea>

	{#if error}
		<p class={styles.error()}>{error}</p>
	{:else if hint}
		<p class={styles.hint()}>{hint}</p>
	{/if}
</div>
