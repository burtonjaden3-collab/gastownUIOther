<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	const input = tv({
		slots: {
			wrapper: 'flex flex-col gap-1.5',
			label: 'font-stencil text-sm uppercase tracking-wider text-chrome-400',
			field: [
				'w-full px-3 py-2 bg-oil-950 border-2 border-oil-700 rounded-sm',
				'font-mono text-sm text-chrome-100 placeholder:text-chrome-600',
				'transition-all duration-150',
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
			},
			size: {
				sm: {
					field: 'h-8 text-xs'
				},
				md: {
					field: 'h-10'
				},
				lg: {
					field: 'h-12 text-base'
				}
			}
		},
		defaultVariants: {
			hasError: false,
			size: 'md'
		}
	});

	type InputVariants = VariantProps<typeof input>;

	interface Props {
		id?: string;
		name?: string;
		type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'search';
		value?: string;
		placeholder?: string;
		label?: string;
		hint?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		size?: InputVariants['size'];
		class?: string;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
	}

	let {
		id,
		name,
		type = 'text',
		value = $bindable(''),
		placeholder,
		label,
		hint,
		error,
		disabled = false,
		required = false,
		size = 'md',
		class: className = '',
		oninput,
		onchange
	}: Props = $props();

	const hasError = $derived(!!error);
	const styles = $derived(input({ hasError, size }));
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

	<input
		{id}
		{name}
		{type}
		bind:value
		{placeholder}
		{disabled}
		{required}
		class={styles.field()}
		{oninput}
		{onchange}
	/>

	{#if error}
		<p class={styles.error()}>{error}</p>
	{:else if hint}
		<p class={styles.hint()}>{hint}</p>
	{/if}
</div>
