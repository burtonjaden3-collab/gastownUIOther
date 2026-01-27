<script lang="ts">
import { useThrelte } from '@threlte/core';
import WarBoy from './WarBoy.svelte';

interface Props {
	agents: Array<{ name: string; state: string; assignedTask?: string }>;
	tasks: Array<{ id: string; status: string }>;
}

const { agents, tasks }: Props = $props();

// Match WastelandScene frustum dimensions
const { size } = useThrelte();
const aspect = $derived(size.current.width / Math.max(size.current.height, 1));
const frustumH = 8;
const frustumW = $derived(frustumH * aspect);

/**
 * Position computation for each agent based on state
 * - idle: Clustered on citadel platforms (right side, elevated)
 * - busy: On top of assigned vehicle (desert road between staging and citadel)
 * - offline: Handled by WarBoy component (renders nothing)
 */
function computePosition(agent: { name: string; state: string; assignedTask?: string }, index: number): { x: number; y: number; z: number } {
	// Idle agents: on citadel platforms
	if (agent.state === 'idle') {
		return {
			x: frustumW / 2 - 3 + (index % 3) * 0.5, // clustered near citadel (right side)
			y: 1.5 + Math.floor(index / 3) * 0.6, // elevated platforms, stacked rows
			z: -0.5 + (index % 3) * 0.3
		};
	}

	// Busy agents: on top of assigned vehicle
	if (agent.state === 'busy' && agent.assignedTask) {
		// Find the matching task
		const taskIndex = tasks.findIndex(t => t.id === agent.assignedTask && t.status === 'running');

		if (taskIndex !== -1) {
			// Running tasks are positioned across the desert road
			// Staging area (left) to citadel (right)
			const stagingX = -frustumW / 2 + 1;
			const citadelX = frustumW / 2 - 2;
			const roadLength = citadelX - stagingX;

			// Distribute running tasks along the road
			const runningTasks = tasks.filter(t => t.status === 'running');
			const positionInQueue = runningTasks.findIndex(t => t.id === agent.assignedTask);
			const progress = positionInQueue / Math.max(runningTasks.length - 1, 1);

			return {
				x: stagingX + roadLength * progress,
				y: 0.6, // on top of vehicle (vehicle body is 0.25 tall, base at 0.2)
				z: -0.8 + (positionInQueue % 3) * 0.4 // z variation for visual depth
			};
		}
	}

	// Fallback to idle position if task not found or state is offline
	return {
		x: frustumW / 2 - 3 + (index % 3) * 0.5,
		y: 1.5 + Math.floor(index / 3) * 0.6,
		z: -0.5 + (index % 3) * 0.3
	};
}
</script>

{#each agents as agent, index (agent.name)}
	{@const pos = computePosition(agent, index)}
	<WarBoy
		agentState={agent.state as 'idle' | 'busy' | 'offline'}
		x={pos.x}
		y={pos.y}
		z={pos.z}
	/>
{/each}
