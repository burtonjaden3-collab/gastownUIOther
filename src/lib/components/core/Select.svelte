<script lang="ts">
	import { tv } from 'tailwind-variants';
	import { ChevronDown } from 'lucide-svelte';

	const select = tv({
		slots: {
			wrapper: 'flex flex-col gap-1.5',
			label: 'font-stencil text-sm uppercase tracking-wider text-chrome-400',
			container: 'relative',
			field: [
				'w-full h-10 px-3 pr-10 bg-oil-950 border-2 border-oil-700 rounded-sm',
				'font-mono text-sm text-chrome-100 appearance-none cursor-pointer',
				'transition-all duration-150',
				'hover:border-oil-600',
				'focus:outline-none focus:border-rust-500 focus:ring-1 focus:ring-rust-500/50',
				'disabled:opacity-50 disabled:cursor-not-allowed'
			],
			icon: 'absolute right-3 top-1/2 -translate-y-1/2 text-chrome-500 pointer-events-none',
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

	interface Option {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		id?: string;
		name?: string;
		value?: string;
		options: Option[];
		placeholder?: string;
		label?: string;
		hint?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		onchange?: (e: Event) => void;
	}

	let {
		id,
		name,
		value = $bindable(''),
		options,
		placeholder,
		label,
		hint,
		error,
		disabled = false,
		required = false,
		class: className = '',
		onchange
	}: Props = $props();

	const hasError = $derived(!!error);
	const styles = $derived(select({ hasError }));
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

	<div class={styles.container()}>
		<select
			{id}
			{name}
			bind:value
			{disabled}
			{required}
			class={styles.field()}
			{onchange}
		>
			{#if placeholder}
				<option value="" disabled>{placeholder}</option>
			{/if}
			{#each options as option}
				<option value={option.value} disabled={option.disabled}>
					{option.label}
				</option>
			{/each}
		</select>
		<ChevronDown size={16} class={styles.icon()} />
	</div>

	{#if error}
		<p class={styles.error()}>{error}</p>
	{:else if hint}
		<p class={styles.hint()}>{hint}</p>
	{/if}
</div>
