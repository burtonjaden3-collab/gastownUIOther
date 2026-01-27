<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { WASTELAND } from './colors';

	interface Props {
		position: [number, number, number];
		density?: number;
		speed?: number;
		particleCount?: number;
		color?: string;
		spread?: number;
	}

	const {
		position,
		density = 0.5,
		speed = 0.5,
		particleCount: COUNT = 80,
		color = WASTELAND.smoke.light,
		spread = 0.3,
	}: Props = $props();

	let pointsRef: THREE.Points | null = $state(null);

	// svelte-ignore state_referenced_locally — buffer sizes are fixed at allocation
	const positions = new Float32Array(COUNT * 3);
	// svelte-ignore state_referenced_locally
	const lifetimes = new Float32Array(COUNT);

	function resetParticle(i: number) {
		positions[i * 3] = position[0] + (Math.random() - 0.5) * spread;
		positions[i * 3 + 1] = position[1];
		positions[i * 3 + 2] = position[2] + (Math.random() - 0.5) * spread;
		lifetimes[i] = Math.random();
	}

	// svelte-ignore state_referenced_locally — loop uses fixed init-time count
	for (let i = 0; i < COUNT; i++) {
		resetParticle(i);
	}

	useTask((delta) => {
		if (!pointsRef) return;
		const activeCount = Math.floor(COUNT * density);
		for (let i = 0; i < COUNT; i++) {
			if (i >= activeCount) {
				positions[i * 3 + 1] = -100;
				continue;
			}
			lifetimes[i] += delta * speed * 0.8;
			if (lifetimes[i] > 1) {
				resetParticle(i);
				lifetimes[i] = 0;
			}
			// Rise upward
			positions[i * 3 + 1] += delta * speed * 2.5;
			// Horizontal drift
			positions[i * 3] += Math.sin(lifetimes[i] * 5 + i * 0.7) * delta * 0.15;
		}
		const attr = pointsRef.geometry.getAttribute('position') as THREE.BufferAttribute;
		attr.needsUpdate = true;
	});
</script>

<T.Points oncreate={(ref) => { pointsRef = ref as unknown as THREE.Points; }}>
	<T.BufferGeometry
		oncreate={(ref) => {
			ref.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		}}
	/>
	<T.PointsMaterial
		{color}
		size={0.08}
		transparent
		opacity={0.6}
		depthWrite={false}
		sizeAttenuation
	/>
</T.Points>
