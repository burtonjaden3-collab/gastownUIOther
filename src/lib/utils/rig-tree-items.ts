// src/lib/utils/rig-tree-items.ts
// Build flat list of visible tree items for rig tree keyboard navigation

import type { Rig } from '$lib/stores/rigs.svelte';
import type { Agent } from '$lib/stores/agents.svelte';
import type { TreeItem } from './tree-keyboard';
import type { Selection } from '$lib/components/rigs/RigTree.svelte';

const AGENT_TYPES = ['witness', 'refinery', 'polecat', 'crew'] as const;

export function buildVisibleRigTreeItems(
	rigs: Rig[],
	expandedRigs: Set<string>,
	expandedTypes: Map<string, Set<string>>,
	selection: Selection,
	onSelect: (selection: Selection) => void,
	toggleRig: (name: string) => void,
	toggleType: (rigName: string, type: string) => void
): TreeItem[] {
	const items: TreeItem[] = [];

	for (const rig of rigs) {
		const isRigExpanded = expandedRigs.has(rig.name);
		const isRigSelected = selection?.type === 'rig' && selection.rig.name === rig.name;

		items.push({
			id: `rig-${rig.name}`,
			level: 1,
			isExpandable: true,
			isExpanded: isRigExpanded,
			isSelected: isRigSelected,
			onSelect: () => onSelect({ type: 'rig', rig }),
			onToggle: () => toggleRig(rig.name)
		});

		if (isRigExpanded) {
			for (const agentType of AGENT_TYPES) {
				const agents = rig.agents.filter((a) => a.role === agentType);
				if (agents.length > 0) {
					const isTypeExpanded = expandedTypes.get(rig.name)?.has(agentType) || false;

					items.push({
						id: `type-${rig.name}-${agentType}`,
						level: 2,
						isExpandable: true,
						isExpanded: isTypeExpanded,
						isSelected: false,
						onSelect: () => {}, // Type nodes don't select
						onToggle: () => toggleType(rig.name, agentType)
					});

					if (isTypeExpanded) {
						for (const agent of agents) {
							const isAgentSelected =
								selection?.type === 'agent' && selection.agent.id === agent.id;

							items.push({
								id: `agent-${agent.id}`,
								level: 3,
								isExpandable: false,
								isExpanded: false,
								isSelected: isAgentSelected,
								onSelect: () => onSelect({ type: 'agent', agent, rig })
							});
						}
					}
				}
			}
		}
	}

	return items;
}
