<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';
	import WastelandScene from './WastelandScene.svelte';

	interface Props {
		class?: string;
		load?: number;
	}

	const { class: className, load = 0 }: Props = $props();
</script>

{#if browser}
	<div class={cn('h-[300px] w-full overflow-hidden border-b border-oil-800', className)}>
		<Canvas renderMode="always">
			<WastelandScene {load} />
		</Canvas>
	</div>
{/if}
