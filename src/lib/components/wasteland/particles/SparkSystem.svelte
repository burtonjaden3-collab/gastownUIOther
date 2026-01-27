<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { WASTELAND } from '../colors';

	interface Props {
		active: boolean;
	}

	const { active }: Props = $props();

	const MAX_PARTICLES = 50;

	// Particle state
	const positions = new Float32Array(MAX_PARTICLES * 3);
	const vx = new Float32Array(MAX_PARTICLES);
	const vy = new Float32Array(MAX_PARTICLES);
	const vz = new Float32Array(MAX_PARTICLES);
	const lifetimes = new Float32Array(MAX_PARTICLES);

	// Initialize all particles below ground
	for (let i = 0; i < MAX_PARTICLES; i++) {
		positions[i * 3 + 1] = -10;
		lifetimes[i] = 1; // Mark as dead
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

	const material = new THREE.PointsMaterial({
		size: 0.06,
		color: new THREE.Color(WASTELAND.flame.spark),
		transparent: true,
		opacity: 0.8,
		depthWrite: false,
		blending: THREE.AdditiveBlending
	});

	let points: THREE.Points | undefined = $state();

	const spawnParticle = (index: number) => {
		const i3 = index * 3;
		positions[i3] = Math.random() * 2 - 1;
		positions[i3 + 1] = 3 + Math.random();
		positions[i3 + 2] = Math.random() * 0.5 - 0.25;
		vx[index] = Math.random() * 2 - 1;
		vy[index] = 2 + Math.random() * 3;
		vz[index] = Math.random() * 0.5 - 0.25;
		lifetimes[index] = 0;
	};

	useTask((delta) => {
		if (!points) return;

		if (active) {
			const spawnCount = Math.floor(3 + Math.random() * 3);
			let spawned = 0;
			for (let i = 0; i < MAX_PARTICLES && spawned < spawnCount; i++) {
				if (lifetimes[i] > 0.5) {
					spawnParticle(i);
					spawned++;
				}
			}
		}

		for (let i = 0; i < MAX_PARTICLES; i++) {
			if (lifetimes[i] > 0.5) continue;
			const i3 = i * 3;
			lifetimes[i] += delta;
			if (lifetimes[i] > 0.5) {
				positions[i3 + 1] = -10;
				continue;
			}
			vy[i] -= delta * 6;
			positions[i3] += vx[i] * delta;
			positions[i3 + 1] += vy[i] * delta;
			positions[i3 + 2] += vz[i] * delta;
		}

		geometry.attributes.position.needsUpdate = true;
	});
</script>

<T.Points {geometry} {material} oncreate={(ref) => { points = ref as unknown as THREE.Points; }} />
