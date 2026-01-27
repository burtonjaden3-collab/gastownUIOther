<script lang="ts">
	import { ListTodo, Crosshair, Truck } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	export type WorkTab = 'queue' | 'sling' | 'convoys';

	interface TabDef {
		id: WorkTab;
		label: string;
		icon: typeof ListTodo;
	}

	interface Props {
		active: WorkTab;
		onchange: (tab: WorkTab) => void;
	}

	let { active, onchange }: Props = $props();

	const tabs: TabDef[] = [
		{ id: 'queue', label: 'Queue', icon: ListTodo },
		{ id: 'sling', label: 'Sling', icon: Crosshair },
		{ id: 'convoys', label: 'Convoys', icon: Truck }
	];
</script>

<div class="flex border-b border-oil-700" role="tablist" aria-label="Work sections">
	{#each tabs as tab}
		{@const Icon = tab.icon}
		<button
			role="tab"
			aria-selected={active === tab.id}
			aria-controls="{tab.id}-panel"
			class={cn(
				'flex items-center gap-2 px-5 py-3 font-display text-sm uppercase tracking-wider transition-all',
				active === tab.id
					? 'text-rust-400 border-b-2 border-rust-500 bg-oil-900/50'
					: 'text-chrome-500 hover:text-chrome-300 hover:bg-oil-800/50'
			)}
			onclick={() => onchange(tab.id)}
		>
			<Icon size={16} />
			{tab.label}
		</button>
	{/each}
</div>
