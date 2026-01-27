<script lang="ts">
	import { page } from '$app/stores';
	import { eventStream, type ConnectionStatus as ConnectionStatusType } from '$lib/api/events';
	import { browser } from '$app/environment';
	import NavGroup from '$lib/components/layout/NavGroup.svelte';
	import SidebarLogo from '$lib/components/layout/SidebarLogo.svelte';
	import ConnectionStatus from '$lib/components/layout/ConnectionStatus.svelte';
	import { navGroups, type NavGroupData } from '$lib/components/layout/nav-config';

	// Track collapsed state per group — all open by default
	let collapsed = $state<Record<string, boolean>>({});

	function toggleGroup(id: string) {
		collapsed[id] = !collapsed[id];
	}

	function isGroupActive(group: NavGroupData): boolean {
		const path = $page.url.pathname;
		return group.items.some(
			(item) => path === item.href || (item.href !== '/' && path.startsWith(item.href))
		);
	}

	let connectionStatus = $state<ConnectionStatusType>(eventStream.status);

	$effect(() => {
		const unsubscribe = eventStream.subscribe((s) => {
			connectionStatus = s;
		});
		return unsubscribe;
	});

	const displayStatus = $derived(
		!browser && connectionStatus === 'disconnected' ? 'connecting' : connectionStatus
	);
</script>

<aside class="w-64 bg-oil-900 border-r border-oil-700/80 flex flex-col h-screen sidebar-chrome" aria-label="Main navigation">
	<SidebarLogo />
	<div class="hazard-stripe"></div>

	<!-- Grouped Navigation -->
	<nav class="flex-1 overflow-y-auto overflow-x-hidden py-2 sidebar-scroll">
		{#each navGroups as group, groupIdx}
			<NavGroup
				id={group.id}
				label={group.label}
				icon={group.icon}
				items={group.items}
				isActive={isGroupActive(group)}
				isCollapsed={collapsed[group.id] ?? false}
				currentPath={$page.url.pathname}
				showDivider={groupIdx > 0}
				onToggle={toggleGroup}
			/>
		{/each}
	</nav>

	<ConnectionStatus status={displayStatus} />
</aside>

<style>
	/* Subtle chrome texture on the sidebar */
	.sidebar-chrome {
		background-image: linear-gradient(
			180deg,
			rgba(61, 61, 61, 0.04) 0%,
			transparent 30%,
			transparent 70%,
			rgba(26, 26, 26, 0.06) 100%
		);
	}

	/* Smoother scrollbar for the nav area */
	.sidebar-scroll {
		scrollbar-width: thin;
		scrollbar-color: theme('colors.oil.700') transparent;
	}

	.sidebar-scroll::-webkit-scrollbar {
		width: 4px;
	}

	.sidebar-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar-scroll::-webkit-scrollbar-thumb {
		background: theme('colors.oil.700');
		border-radius: 2px;
	}
</style>
