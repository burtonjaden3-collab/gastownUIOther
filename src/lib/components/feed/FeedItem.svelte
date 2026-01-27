<script lang="ts">
	import { Zap, GitMerge, Mail, AlertTriangle, Radio, Send, Activity } from 'lucide-svelte';

	interface Props {
		timestamp: string;
		type: string;
		source: string;
		actor: string;
		message: string;
	}

	let { timestamp, type, source, actor, message }: Props = $props();

	const typeConfig: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
		spawn: { icon: Zap, color: 'text-green-400', bg: 'bg-green-500/10' },
		merge_started: { icon: GitMerge, color: 'text-purple-400', bg: 'bg-purple-500/10' },
		merged: { icon: GitMerge, color: 'text-purple-400', bg: 'bg-purple-500/10' },
		mail: { icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/10' },
		conflict: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
		patrol: { icon: Radio, color: 'text-chrome-400', bg: 'bg-chrome-500/10' },
		sling: { icon: Send, color: 'text-warning-400', bg: 'bg-warning-500/10' },
		nudge: { icon: Send, color: 'text-warning-400', bg: 'bg-warning-500/10' },
		done: { icon: Zap, color: 'text-green-400', bg: 'bg-green-500/10' },
		halt: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
		handoff: { icon: Activity, color: 'text-chrome-400', bg: 'bg-oil-800' },
		session_start: { icon: Zap, color: 'text-green-400', bg: 'bg-green-500/10' }
	};

	const config = $derived(
		typeConfig[type] || {
			icon: Activity,
			color: 'text-chrome-400',
			bg: 'bg-oil-800'
		}
	);
	const Icon = $derived(config.icon);

	function relativeTime(ts: string): string {
		try {
			const now = Date.now();
			const then = new Date(ts).getTime();
			const diff = Math.floor((now - then) / 1000);
			if (diff < 60) return `${diff}s ago`;
			if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
			if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
			return `${Math.floor(diff / 86400)}d ago`;
		} catch {
			return ts;
		}
	}
</script>

<div
	class="flex items-start gap-3 px-4 py-3 border-b border-oil-700/50 hover:bg-oil-800/50 transition-colors"
>
	<div
		class="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 {config.bg}"
	>
		<Icon size={16} class={config.color} />
	</div>
	<div class="flex-1 min-w-0">
		<div class="flex items-center gap-2">
			<span
				class="font-mono text-xs uppercase px-1.5 py-0.5 rounded {config.bg} {config.color}"
				>{type}</span
			>
			<span class="font-mono text-xs text-rust-400">{actor}</span>
		</div>
		<p class="text-sm text-chrome-300 mt-1 truncate">{message}</p>
	</div>
	<span class="text-xs font-mono text-chrome-500 flex-shrink-0">{relativeTime(timestamp)}</span>
</div>
