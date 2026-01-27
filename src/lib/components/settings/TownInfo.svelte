<script lang="ts">
	import { MapPin, User, Calendar, Boxes } from 'lucide-svelte';

	interface Props {
		name: string;
		owner: string;
		createdAt: string;
		rigCount: number;
		overseer?: string | null;
	}

	let { name, owner, createdAt, rigCount, overseer }: Props = $props();
</script>

<div class="p-4 rounded-sm bg-oil-800 border border-oil-700">
	<div class="flex items-center gap-3 mb-4">
		<div class="w-10 h-10 rounded-sm bg-rust-600/20 flex items-center justify-center">
			<MapPin size={20} class="text-rust-400" />
		</div>
		<div>
			<h3 class="font-stencil text-lg uppercase tracking-wider text-chrome-100">{name}</h3>
			<p class="text-[10px] font-mono uppercase text-chrome-500">Town Configuration</p>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-1">
			<p class="text-[10px] font-stencil uppercase text-chrome-500">Owner</p>
			<div class="flex items-center gap-1.5">
				<User size={12} class="text-rust-400" />
				<p class="font-mono text-sm text-chrome-200">{owner}</p>
			</div>
		</div>
		<div class="space-y-1">
			<p class="text-[10px] font-stencil uppercase text-chrome-500">Created</p>
			<div class="flex items-center gap-1.5">
				<Calendar size={12} class="text-chrome-400" />
				<p class="font-mono text-sm text-chrome-200">{new Date(createdAt).toLocaleDateString()}</p>
			</div>
		</div>
		<div class="space-y-1">
			<p class="text-[10px] font-stencil uppercase text-chrome-500">Rigs</p>
			<div class="flex items-center gap-1.5">
				<Boxes size={12} class="text-chrome-400" />
				<p class="font-mono text-sm text-chrome-200">{rigCount}</p>
			</div>
		</div>
		{#if overseer}
			<div class="space-y-1">
				<p class="text-[10px] font-stencil uppercase text-chrome-500">Overseer</p>
				<p class="font-mono text-sm text-chrome-200">{overseer}</p>
			</div>
		{/if}
	</div>
</div>
