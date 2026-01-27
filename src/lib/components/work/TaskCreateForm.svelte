<script lang="ts">
	import { Code, Database, MessageSquare, X } from 'lucide-svelte';
	import { Button, Input, Textarea } from '$lib/components/core';
	import { tasksStore, type TaskType } from '$lib/stores/tasks.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		onclose: () => void;
		oncreate: () => void;
	}

	let { onclose, oncreate }: Props = $props();

	let title = $state('');
	let description = $state('');
	let taskType = $state<TaskType>('general');
	let errors = $state<{ title?: string; description?: string }>({});
	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	const typeOptions: { value: TaskType; label: string; icon: typeof Code; hint: string }[] = [
		{ value: 'code', label: 'Code', icon: Code, hint: 'Code generation, bug fixes, refactoring' },
		{ value: 'data', label: 'Data', icon: Database, hint: 'File transformations, analysis, reports' },
		{ value: 'general', label: 'General', icon: MessageSquare, hint: 'Open-ended prompts' }
	];

	function validate(): boolean {
		errors = {};
		if (!title.trim()) errors.title = 'Task title is required';
		else if (title.length < 5) errors.title = 'Title must be at least 5 characters';

		if (!description.trim()) errors.description = 'Description is required';
		else if (description.length < 10) errors.description = 'Description must be at least 10 characters';

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validate()) return;
		submitting = true;
		submitError = null;

		try {
			const task = await tasksStore.createTask({
				title: title.trim(),
				description: description.trim(),
				type: taskType
			});

			if (task) {
				oncreate();
				onclose();
			} else {
				submitError = tasksStore.error || 'Failed to create task';
			}
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Unexpected error';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="p-4 space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="font-stencil text-lg uppercase tracking-wider text-chrome-200">New Task</h2>
		<button class="p-1 text-chrome-500 hover:text-chrome-300 transition-colors" onclick={onclose}>
			<X size={18} />
		</button>
	</div>

	<!-- Task Type Selector -->
	<div class="grid grid-cols-3 gap-2">
		{#each typeOptions as opt}
			{@const Icon = opt.icon}
			<button
				class={cn(
					'flex flex-col items-center gap-1 p-3 rounded-sm border-2 transition-all',
					taskType === opt.value
						? 'border-rust-500 bg-rust-600/10 text-rust-400'
						: 'border-oil-700 bg-oil-900 text-chrome-400 hover:border-oil-600'
				)}
				onclick={() => taskType = opt.value}
			>
				<Icon size={18} />
				<span class="font-stencil text-xs uppercase">{opt.label}</span>
			</button>
		{/each}
	</div>
	<p class="text-xs text-chrome-500">{typeOptions.find(o => o.value === taskType)?.hint}</p>

	<!-- Form Fields -->
	<Input
		label="Title"
		placeholder="What needs to be done?"
		bind:value={title}
		error={errors.title}
		required
	/>

	<Textarea
		label="Description"
		placeholder="Provide details, context, and acceptance criteria..."
		bind:value={description}
		error={errors.description}
		rows={5}
		required
	/>

	<!-- Error -->
	{#if submitError}
		<p class="text-sm text-red-400">{submitError}</p>
	{/if}

	<!-- Actions -->
	<div class="flex items-center gap-3 pt-2">
		<Button variant="secondary" size="sm" onclick={onclose}>Cancel</Button>
		<Button size="sm" disabled={submitting} onclick={handleSubmit}>
			{submitting ? 'Creating...' : 'Create Task'}
		</Button>
	</div>
</div>
