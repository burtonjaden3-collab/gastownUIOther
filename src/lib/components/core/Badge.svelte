<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';
	import type { Snippet } from 'svelte';

	const badge = tv({
		base: [
			'inline-flex items-center gap-1.5 px-2 py-0.5',
			'font-mono text-xs uppercase tracking-wide',
			'border rounded-sm'
		],
		variants: {
			variant: {
				default: 'bg-oil-800 border-oil-600 text-chrome-300',
				rust: 'bg-rust-900/50 border-rust-700 text-rust-300',
				warning: 'bg-warning-900/50 border-warning-700 text-warning-300',
				success: 'bg-green-900/50 border-green-700 text-green-300',
				danger: 'bg-red-900/50 border-red-700 text-red-300',
				chrome: 'bg-chrome-800/50 border-chrome-600 text-chrome-200'
			},
			glow: {
				true: '',
				false: ''
			}
		},
		compoundVariants: [
			{
				variant: 'rust',
				glow: true,
				class: 'shadow-[0_0_8px_rgba(235,107,63,0.3)]'
			},
			{
				variant: 'warning',
				glow: true,
				class: 'shadow-[0_0_8px_rgba(251,191,36,0.3)]'
			},
			{
				variant: 'success',
				glow: true,
				class: 'shadow-[0_0_8px_rgba(34,197,94,0.3)]'
			},
			{
				variant: 'danger',
				glow: true,
				class: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]'
			}
		],
		defaultVariants: {
			variant: 'default',
			glow: false
		}
	});

	type BadgeVariants = VariantProps<typeof badge>;

	interface Props {
		variant?: BadgeVariants['variant'];
		glow?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'default',
		glow = false,
		class: className = '',
		children
	}: Props = $props();
</script>

<span class={badge({ variant, glow, class: className })}>
	{@render children()}
</span>
