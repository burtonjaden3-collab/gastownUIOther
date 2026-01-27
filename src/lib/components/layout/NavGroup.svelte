<script lang="ts">
	import { ChevronDown, LayoutDashboard } from 'lucide-svelte';

	interface NavItem {
		href: string;
		label: string;
		icon: typeof LayoutDashboard;
		badge?: () => number;
	}

	interface Props {
		id: string;
		label: string;
		icon: typeof LayoutDashboard;
		items: NavItem[];
		isActive: boolean;
		isCollapsed: boolean;
		currentPath: string;
		showDivider?: boolean;
		onToggle: (id: string) => void;
	}

	let {
		id,
		label,
		icon,
		items,
		isActive,
		isCollapsed,
		currentPath,
		showDivider = false,
		onToggle
	}: Props = $props();

	const GroupIcon = $derived(icon);

	function isItemActive(item: NavItem): boolean {
		return (
			currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))
		);
	}
</script>

{#if showDivider}
	<div class="mx-3 my-1.5 border-t border-oil-800/80"></div>
{/if}
<button
	onclick={() => onToggle(id)}
	class="w-full flex items-center gap-2 px-3 py-2 mx-0
		text-left group/header cursor-pointer select-none
		transition-colors duration-150
		focus-visible:outline-2 focus-visible:outline-rust-500 focus-visible:outline-offset-[-2px]
		{isActive ? 'text-rust-400' : 'text-chrome-500 hover:text-chrome-300'}"
	aria-expanded={!isCollapsed}
	aria-controls="nav-group-{id}"
>
	<GroupIcon size={13} class="opacity-60 flex-shrink-0" />
	<span
		class="text-[11px] font-stencil uppercase tracking-[0.18em] flex-1
			{isActive ? 'text-rust-400/90' : ''}"
	>
		{label}
	</span>
	<ChevronDown
		size={12}
		class="opacity-40 transition-transform duration-200 flex-shrink-0
			{isCollapsed ? '-rotate-90' : 'rotate-0'}"
	/>
</button>

{#if !isCollapsed}
	<ul class="nav-group-items list-none m-0 p-0" id="nav-group-{id}">
		{#each items as item}
			{@const itemActive = isItemActive(item)}
			{@const badgeCount = item.badge?.() ?? 0}
			{@const ItemIcon = item.icon}
			<li>
				<a
					href={item.href}
					aria-current={itemActive ? 'page' : undefined}
					class="group/item flex items-center gap-2.5 mx-2 px-3 py-2 rounded-sm
						font-body text-[13px] tracking-wide
						transition-all duration-150 relative
						{itemActive
						? 'bg-rust-600/15 text-rust-300 nav-item-active'
						: 'text-chrome-400 hover:bg-oil-800/70 hover:text-chrome-200'}"
				>
					{#if itemActive}
						<span
							class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-sm
								bg-rust-500 shadow-[0_0_8px_rgba(235,107,63,0.5)]"
						></span>
					{/if}

					<ItemIcon
						size={16}
						class="flex-shrink-0 transition-colors duration-150
							{itemActive
							? 'text-rust-400'
							: 'text-chrome-500 group-hover/item:text-chrome-300'}"
					/>
					<span class="flex-1 truncate">{item.label}</span>
					{#if badgeCount > 0}
						<span
							class="ml-auto px-1.5 py-0.5 min-w-[18px] flex items-center justify-center
								bg-rust-600 text-white text-[9px] font-bold rounded-sm
								shadow-[0_0_6px_rgba(235,107,63,0.4)]"
							aria-label="{badgeCount} unread"
						>
							{badgeCount > 9 ? '9+' : badgeCount}
						</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	/* Active nav item subtle glow */
	.nav-item-active {
		box-shadow: inset 0 0 12px rgba(235, 107, 63, 0.06);
	}

	/* Smooth collapse animation */
	.nav-group-items {
		animation: nav-expand 180ms ease-out;
	}

	@keyframes nav-expand {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-group-items {
			animation: none;
		}
	}
</style>
