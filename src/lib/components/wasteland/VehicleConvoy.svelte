<script lang="ts">
import { T, useThrelte } from '@threlte/core';
import Vehicle from './Vehicle.svelte';
import VehicleExhaust from './VehicleExhaust.svelte';

interface Props {
	tasks: Array<{ id: string; status: string; type?: string }>;
}

const { tasks }: Props = $props();

// Frustum dimensions (matches WastelandScene)
const { size } = useThrelte();
const aspect = $derived(size.current.width / Math.max(size.current.height, 1));
const frustumH = 8;
const frustumW = $derived(frustumH * aspect);

// Group tasks by status for position indexing
const groupedTasks = $derived(() => {
	const groups = {
		pending: [] as typeof tasks,
		running: [] as typeof tasks,
		completed: [] as typeof tasks,
		blocked: [] as typeof tasks,
		failed: [] as typeof tasks
	};

	tasks.forEach((task) => {
		const status = task.status as keyof typeof groups;
		if (groups[status]) {
			groups[status].push(task);
		}
	});

	return groups;
});

// Position computation based on status
function computePosition(task: (typeof tasks)[0], globalIndex: number): { x: number; z: number } {
	const grouped = groupedTasks();
	const status = task.status;

	// Find index within status group
	const statusGroup = grouped[status as keyof typeof grouped] || [];
	const statusIndex = statusGroup.findIndex((t) => t.id === task.id);
	const index = statusIndex >= 0 ? statusIndex : globalIndex;

	switch (status) {
		case 'pending':
			// Staging area (left side)
			return {
				x: -frustumW / 2 + 1.5 + index * 0.3,
				z: -0.5 + (index % 3) * 0.4
			};

		case 'running': {
			// Distributed across desert road
			const runningCount = grouped.running.length;
			const progress = runningCount > 1 ? index / (runningCount - 1) : 0.5;
			const startX = -frustumW / 2 + 2.5;
			const endX = frustumW / 2 - 3;
			return {
				x: startX + progress * (endX - startX),
				z: -0.3 + (index % 3) * 0.3
			};
		}

		case 'completed':
			// Citadel gate area (right side)
			return {
				x: frustumW / 2 - 2 + index * 0.2,
				z: 0.5
			};

		case 'blocked': {
			// Same as running position but stopped
			const runningCount = grouped.running.length + grouped.blocked.length;
			const combinedIndex = grouped.running.length + index;
			const progress = runningCount > 1 ? combinedIndex / (runningCount - 1) : 0.5;
			const startX = -frustumW / 2 + 2.5;
			const endX = frustumW / 2 - 3;
			return {
				x: startX + progress * (endX - startX),
				z: 0.2
			};
		}

		case 'failed': {
			// Running position but offset to roadside
			const failedIndex = index;
			const progress = grouped.failed.length > 1 ? failedIndex / (grouped.failed.length - 1) : 0.5;
			const startX = -frustumW / 2 + 2.5;
			const endX = frustumW / 2 - 3;
			return {
				x: startX + progress * (endX - startX),
				z: 1.0
			};
		}

		default:
			return { x: 0, z: 0 };
	}
}
</script>

{#each tasks as task, index (task.id)}
	{@const pos = computePosition(task, index)}
	<Vehicle status={task.status as any} taskType={task.type as any} x={pos.x} z={pos.z} />
	<VehicleExhaust
		active={task.status === 'running' || task.status === 'pending'}
		x={pos.x}
		z={pos.z}
	/>
{/each}
