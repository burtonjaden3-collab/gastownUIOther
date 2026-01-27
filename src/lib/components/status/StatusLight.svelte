<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';

	const statusLight = tv({
		base: 'rounded-full',
		variants: {
			status: {
				online: 'bg-green-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(34,197,94,0.6)]',
				offline: 'bg-red-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(239,68,68,0.6)]',
				busy: 'bg-warning-400 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(251,191,36,0.6)] animate-pulse',
				idle: 'bg-chrome-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(107,114,128,0.4)]',
				pending: 'bg-blue-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(59,130,246,0.6)] animate-pulse-slow'
			},
			size: {
				sm: 'w-2 h-2',
				md: 'w-3 h-3',
				lg: 'w-4 h-4'
			}
		},
		defaultVariants: {
			status: 'idle',
			size: 'md'
		}
	});

	type StatusLightVariants = VariantProps<typeof statusLight>;

	interface Props {
		status?: StatusLightVariants['status'];
		size?: StatusLightVariants['size'];
		class?: string;
	}

	let {
		status = 'idle',
		size = 'md',
		class: className = ''
	}: Props = $props();
</script>

<span
	class={statusLight({ status, size, class: className })}
	role="status"
	aria-label={status}
></span>
