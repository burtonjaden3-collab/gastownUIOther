<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { WASTELAND } from './colors';

	interface Props {
		agentState: 'idle' | 'running' | 'offline';
		x: number;
		y: number;
		z: number;
	}

	let { agentState, x, y, z }: Props = $props();

	let elapsed = $state(0);

	// Idle sway animation
	let swayY = $derived(agentState === 'idle' ? Math.sin(elapsed * Math.PI) * 0.02 : 0);

	useTask((delta) => {
		if (agentState === 'idle') {
			elapsed += delta;
		}
	});
</script>

{#if agentState !== 'offline'}
	<T.Group position.x={x} position.y={y + swayY} position.z={z}>
		<!-- Body capsule -->
		<T.Mesh>
			<T.CapsuleGeometry args={[0.08, 0.3, 4, 8]} />
			<T.MeshStandardMaterial
				color={WASTELAND.warBoy.body}
				roughness={0.7}
				metalness={0.1}
			/>
		</T.Mesh>

		<!-- Head sphere -->
		<T.Mesh position.y={0.28}>
			<T.SphereGeometry args={[0.06, 8, 8]} />
			<T.MeshStandardMaterial
				color={WASTELAND.warBoy.body}
				roughness={0.7}
				metalness={0.1}
			/>
		</T.Mesh>

		<!-- Arms (only visible when running) -->
		{#if agentState === 'running'}
			<!-- Left arm -->
			<T.Mesh position.x={-0.12} position.y={0.1} rotation.z={Math.PI / 4}>
				<T.BoxGeometry args={[0.04, 0.15, 0.04]} />
				<T.MeshStandardMaterial
					color={WASTELAND.warBoy.body}
					roughness={0.7}
					metalness={0.1}
				/>
			</T.Mesh>

			<!-- Right arm -->
			<T.Mesh position.x={0.12} position.y={0.1} rotation.z={-Math.PI / 4}>
				<T.BoxGeometry args={[0.04, 0.15, 0.04]} />
				<T.MeshStandardMaterial
					color={WASTELAND.warBoy.body}
					roughness={0.7}
					metalness={0.1}
				/>
			</T.Mesh>
		{/if}
	</T.Group>
{/if}
