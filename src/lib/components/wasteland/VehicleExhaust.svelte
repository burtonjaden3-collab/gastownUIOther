<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { WASTELAND } from './colors';

	interface Props {
		active: boolean;
		x: number;
		z: number;
	}

	const { active, x, z }: Props = $props();

	const MAX_PARTICLES = 30;

	// Particle system state
	let points: THREE.Points | undefined = $state();
	let positionArray = new Float32Array(MAX_PARTICLES * 3);
	let velocities: { x: number; y: number; z: number }[] = [];
	let lifetimes: number[] = [];
	let nextParticleIndex = 0;

	// Initialize all particles below ground
	for (let i = 0; i < MAX_PARTICLES; i++) {
		positionArray[i * 3] = 0;
		positionArray[i * 3 + 1] = -10; // Hidden below ground
		positionArray[i * 3 + 2] = 0;
		velocities.push({ x: 0, y: 0, z: 0 });
		lifetimes.push(0);
	}

	// Create geometry and material fresh per instance
	let geometry: THREE.BufferGeometry | undefined = $state();
	let material: THREE.PointsMaterial | undefined = $state();

	$effect(() => {
		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

		const mat = new THREE.PointsMaterial({
			size: 0.05,
			color: new THREE.Color(WASTELAND.vehicle.exhaust),
			transparent: true,
			opacity: 0.6,
			depthWrite: false,
			blending: THREE.AdditiveBlending
		});

		geometry = geo;
		material = mat;

		return () => {
			geo.dispose();
			mat.dispose();
		};
	});

	// Spawn new particle at exhaust pipe position
	function spawnParticle() {
		const idx = nextParticleIndex;
		const i = idx * 3;

		// Exhaust pipe position
		positionArray[i] = x - 0.6;
		positionArray[i + 1] = 0.25;
		positionArray[i + 2] = z;

		// Velocity: drift backward (negative x) and slightly upward
		velocities[idx] = {
			x: -0.5 + Math.random() * -0.3,
			y: 0.1 + Math.random() * 0.15,
			z: (Math.random() - 0.5) * 0.1
		};

		lifetimes[idx] = 0;

		nextParticleIndex = (nextParticleIndex + 1) % MAX_PARTICLES;
	}

	// Time-accumulator for frame-rate-independent spawning (~5.5 particles/sec)
	const SPAWN_INTERVAL = 0.18;
	let spawnTimer = 0;

	// Animation loop
	useTask((delta) => {
		if (!points || !geometry || !material) return;

		const posAttr = geometry.getAttribute('position');

		if (active) {
			// Frame-rate-independent spawn using time accumulator
			spawnTimer += delta;
			while (spawnTimer >= SPAWN_INTERVAL) {
				spawnParticle();
				spawnTimer -= SPAWN_INTERVAL;
			}

			// Update active particles
			for (let i = 0; i < MAX_PARTICLES; i++) {
				const idx = i * 3;

				// Skip hidden particles
				if (positionArray[idx + 1] < -5) continue;

				// Update lifetime
				lifetimes[i] += delta;

				if (lifetimes[i] > 1.0) {
					// Recycle: hide particle
					positionArray[idx + 1] = -10;
				} else {
					// Update position
					positionArray[idx] += velocities[i].x * delta;
					positionArray[idx + 1] += velocities[i].y * delta;
					positionArray[idx + 2] += velocities[i].z * delta;
				}
			}
		} else {
			// Hide all particles when not active
			for (let i = 0; i < MAX_PARTICLES; i++) {
				positionArray[i * 3 + 1] = -10;
			}
		}

		posAttr.needsUpdate = true;
	});
</script>

{#if geometry && material}
	<T.Points {geometry} {material} oncreate={(ref) => { points = ref as unknown as THREE.Points; }} />
{/if}
