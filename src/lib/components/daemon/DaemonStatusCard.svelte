<script lang="ts">
	import { Power, Heart } from 'lucide-svelte';

	interface Props {
		running: boolean;
		pid: number | null;
		uptime: string | null;
		heartbeat: { enabled: boolean; interval: string };
	}

	let { running, pid, uptime, heartbeat }: Props = $props();
</script>

<div class="p-6 rounded-sm bg-oil-800 border border-oil-700">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-sm flex items-center justify-center {running ? 'bg-green-500/20' : 'bg-red-500/20'}">
				<Power size={20} class={running ? 'text-green-400' : 'text-red-400'} />
			</div>
			<div>
				<h3 class="font-stencil text-sm uppercase tracking-wider text-chrome-100">Daemon</h3>
				<p class="text-xs font-mono {running ? 'text-green-400' : 'text-red-400'}">
					{running ? 'Running' : 'Stopped'}
				</p>
			</div>
		</div>
		<div class="w-3 h-3 rounded-full {running ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}"></div>
	</div>

	<div class="grid grid-cols-3 gap-4">
		<div>
			<p class="text-[10px] font-stencil uppercase text-chrome-500">PID</p>
			<p class="font-mono text-sm text-chrome-200">{pid ?? '—'}</p>
		</div>
		<div>
			<p class="text-[10px] font-stencil uppercase text-chrome-500">Uptime</p>
			<p class="font-mono text-sm text-chrome-200">{uptime ?? '—'}</p>
		</div>
		<div>
			<p class="text-[10px] font-stencil uppercase text-chrome-500">Heartbeat</p>
			<div class="flex items-center gap-1.5">
				<Heart size={12} class={heartbeat.enabled ? 'text-green-400' : 'text-chrome-600'} />
				<p class="font-mono text-sm text-chrome-200">{heartbeat.interval}</p>
			</div>
		</div>
	</div>
</div>
