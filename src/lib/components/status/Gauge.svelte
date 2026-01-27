<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	const gauge = tv({
		slots: {
			wrapper: 'flex flex-col gap-1',
			label: 'flex justify-between items-center',
			labelText: 'font-mono text-xs uppercase text-chrome-400',
			labelValue: 'font-mono text-xs text-chrome-300',
			track: [
				'relative w-full h-2 bg-oil-800 rounded-full overflow-hidden',
				'shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]'
			],
			fill: 'h-full rounded-full transition-all duration-500 ease-out'
		},
		variants: {
			variant: {
				default: {
					fill: 'bg-gradient-to-r from-chrome-600 to-chrome-400'
				},
				success: {
					fill: 'bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
				},
				warning: {
					fill: 'bg-gradient-to-r from-warning-600 to-warning-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
				},
				danger: {
					fill: 'bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
				},
				rust: {
					fill: 'bg-gradient-to-r from-rust-700 to-rust-500 shadow-[0_0_8px_rgba(235,107,63,0.5)]'
				}
			},
			size: {
				sm: {
					track: 'h-1'
				},
				md: {
					track: 'h-2'
				},
				lg: {
					track: 'h-3'
				}
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'md'
		}
	});

	type GaugeVariants = VariantProps<typeof gauge>;

	interface Props {
		value: number; // 0-100
		max?: number;
		label?: string;
		showValue?: boolean;
		variant?: GaugeVariants['variant'];
		size?: GaugeVariants['size'];
		class?: string;
	}

	let {
		value,
		max = 100,
		label,
		showValue = false,
		variant = 'default',
		size = 'md',
		class: className = ''
	}: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
	const styles = $derived(gauge({ variant, size }));
</script>

<div class={styles.wrapper({ class: className })}>
	{#if label || showValue}
		<div class={styles.label()}>
			{#if label}
				<span class={styles.labelText()}>{label}</span>
			{/if}
			{#if showValue}
				<span class={styles.labelValue()}>{value}/{max}</span>
			{/if}
		</div>
	{/if}

	<div class={styles.track()} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
		<div
			class={styles.fill()}
			style="width: {percentage}%"
		></div>
	</div>
</div>
