<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';
	import type { Snippet } from 'svelte';

	const card = tv({
		slots: {
			root: [
				'bg-oil-900 border border-oil-700 rounded-sm overflow-hidden',
				'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.4)]'
			],
			header: [
				'bg-oil-800 px-4 py-3 border-b border-oil-700',
				'flex items-center justify-between gap-4'
			],
			title: 'font-stencil text-lg uppercase tracking-wider text-chrome-200',
			content: 'p-4',
			footer: 'bg-oil-850 px-4 py-3 border-t border-oil-700'
		},
		variants: {
			variant: {
				default: {},
				elevated: {
					root: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.5)]'
				},
				warning: {
					root: 'border-warning-700/50',
					header: 'bg-warning-900/20'
				},
				danger: {
					root: 'border-red-700/50',
					header: 'bg-red-900/20'
				}
			},
			hazard: {
				true: {},
				false: {}
			}
		},
		defaultVariants: {
			variant: 'default',
			hazard: false
		}
	});

	type CardVariants = VariantProps<typeof card>;

	interface Props {
		variant?: CardVariants['variant'];
		hazard?: boolean;
		class?: string;
		title?: string;
		headerContent?: Snippet;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		variant = 'default',
		hazard = false,
		class: className = '',
		title,
		headerContent,
		children,
		footer
	}: Props = $props();

	const styles = $derived(card({ variant, hazard }));
</script>

<div class={styles.root({ class: className })}>
	{#if hazard}
		<div class="hazard-stripe"></div>
	{/if}

	{#if title || headerContent}
		<div class={styles.header()}>
			{#if title}
				<h3 class={styles.title()}>{title}</h3>
			{/if}
			{#if headerContent}
				{@render headerContent()}
			{/if}
		</div>
	{/if}

	<div class={styles.content()}>
		{@render children()}
	</div>

	{#if footer}
		<div class={styles.footer()}>
			{@render footer()}
		</div>
	{/if}
</div>
