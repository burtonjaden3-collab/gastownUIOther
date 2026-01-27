import {
	LayoutDashboard,
	Bot,
	Settings,
	Boxes,
	Mail,
	Heart,
	GitMerge,
	Timer,
	Dog,
	Gauge,
	Wrench,
	Radio,
	Shield,
	Flame,
	Briefcase
} from 'lucide-svelte';
import { mailStore } from '$lib/stores/mail.svelte';
import { tasksStore } from '$lib/stores/tasks.svelte';

export interface NavItem {
	href: string;
	label: string;
	icon: typeof LayoutDashboard;
	badge?: () => number;
}

export interface NavGroupData {
	id: string;
	label: string;
	icon: typeof LayoutDashboard;
	items: NavItem[];
}

export const navGroups: NavGroupData[] = [
	{
		id: 'command',
		label: 'Command',
		icon: Radio,
		items: [
			{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
			{ href: '/work', label: 'Work', icon: Briefcase, badge: () => tasksStore.stats.pending },
			{ href: '/messages', label: 'Messages', icon: Mail, badge: () => mailStore.unreadCount }
		]
	},
	{
		id: 'fleet',
		label: 'Fleet',
		icon: Gauge,
		items: [
			{ href: '/rigs', label: 'Rigs', icon: Boxes },
			{ href: '/agents', label: 'Agents', icon: Bot }
		]
	},
	{
		id: 'operations',
		label: 'Operations',
		icon: Wrench,
		items: [
			{ href: '/mergequeue', label: 'Merge Queue', icon: GitMerge },
			{ href: '/gates', label: 'Gates', icon: Timer },
			{ href: '/dogs', label: 'Dogs', icon: Dog }
		]
	},
	{
		id: 'system',
		label: 'System',
		icon: Shield,
		items: [
			{ href: '/health', label: 'Health', icon: Heart },
			{ href: '/daemon', label: 'Daemon', icon: Flame },
			{ href: '/settings', label: 'Settings', icon: Settings }
		]
	}
];
