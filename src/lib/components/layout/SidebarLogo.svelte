<script lang="ts">
	import { Fuel, Flame } from 'lucide-svelte';
</script>

<div class="p-4 border-b border-oil-700/80">
	<a href="/" class="flex items-center gap-3 group" aria-label="Gas Town home">
		<div class="relative">
			<div
				class="w-10 h-10 bg-rust-600 rounded-sm flex items-center justify-center
				shadow-[0_0_20px_rgba(235,107,63,0.35)] group-hover:shadow-[0_0_30px_rgba(235,107,63,0.55)]
				transition-shadow duration-300"
			>
				<Fuel size={24} class="text-white" />
			</div>
			<Flame size={12} class="absolute -top-1 -right-1 text-warning-400 animate-flicker" />
		</div>
		<div>
			<h1 class="font-stencil text-xl uppercase tracking-[0.2em] text-chrome-100">Gas Town</h1>
			<p class="text-[10px] font-mono uppercase tracking-wider text-chrome-600">
				Control Center
			</p>
		</div>
	</a>
</div>
