<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';
	import type { Snippet } from 'svelte';

	const button = tv({
		base: [
			'inline-flex items-center justify-center gap-2',
			'font-stencil uppercase tracking-wider',
			'border-2 transition-all duration-150',
			'disabled:opacity-50 disabled:cursor-not-allowed',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust-500 focus-visible:ring-offset-2 focus-visible:ring-offset-oil-950'
		],
		variants: {
			variant: {
				primary: [
					'bg-rust-600 border-rust-700 text-white',
					'hover:bg-rust-500 hover:border-rust-600',
					'active:bg-rust-700',
					'shadow-[0_4px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]',
					'active:shadow-[0_2px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]',
					'active:translate-y-0.5'
				],
				secondary: [
					'bg-oil-800 border-oil-600 text-chrome-200',
					'hover:bg-oil-700 hover:border-oil-500',
					'active:bg-oil-900',
					'shadow-[0_4px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
					'active:shadow-[0_2px_0_rgba(0,0,0,0.3)]',
					'active:translate-y-0.5'
				],
				warning: [
					'bg-warning-500 border-warning-600 text-oil-950',
					'hover:bg-warning-400 hover:border-warning-500',
					'active:bg-warning-600',
					'shadow-[0_4px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]',
					'active:shadow-[0_2px_0_rgba(0,0,0,0.3)]',
					'active:translate-y-0.5'
				],
				danger: [
					'bg-red-600 border-red-700 text-white',
					'hover:bg-red-500 hover:border-red-600',
					'active:bg-red-700',
					'shadow-[0_4px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]',
					'active:shadow-[0_2px_0_rgba(0,0,0,0.3)]',
					'active:translate-y-0.5'
				],
				ghost: [
					'bg-transparent border-transparent text-chrome-300',
					'hover:bg-oil-800 hover:text-chrome-100',
					'active:bg-oil-900'
				]
			},
			size: {
				sm: 'h-8 px-3 text-xs',
				md: 'h-10 px-4 text-sm',
				lg: 'h-12 px-6 text-base'
			}
		},
		defaultVariants: {
			variant: 'primary',
			size: 'md'
		}
	});

	type ButtonVariants = VariantProps<typeof button>;

	interface Props {
		variant?: ButtonVariants['variant'];
		size?: ButtonVariants['size'];
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	class={button({ variant, size, class: className })}
	{onclick}
>
	{@render children()}
</button>
