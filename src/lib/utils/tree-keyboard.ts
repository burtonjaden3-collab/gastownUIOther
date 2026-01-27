// src/lib/utils/tree-keyboard.ts
// Tree keyboard navigation utility for ARIA tree widgets

export interface TreeItem {
	id: string;
	level: number;
	isExpandable: boolean;
	isExpanded: boolean;
	isSelected: boolean;
	onSelect: () => void;
	onToggle?: () => void;
}

export function createTreeKeyboardHandler(
	visibleItems: TreeItem[],
	focusedIndex: number,
	setFocusedIndex: (index: number) => void
) {
	return function handleKeydown(event: KeyboardEvent) {
		if (visibleItems.length === 0) return;

		const currentItem = visibleItems[focusedIndex];
		let handled = true;

		switch (event.key) {
			case 'ArrowDown':
				// Move to next visible item
				if (focusedIndex < visibleItems.length - 1) {
					setFocusedIndex(focusedIndex + 1);
				}
				break;

			case 'ArrowUp':
				// Move to previous visible item
				if (focusedIndex > 0) {
					setFocusedIndex(focusedIndex - 1);
				}
				break;

			case 'ArrowRight':
				// Expand collapsed node or move to first child
				if (currentItem.isExpandable && !currentItem.isExpanded && currentItem.onToggle) {
					currentItem.onToggle();
				} else if (currentItem.isExpanded && focusedIndex < visibleItems.length - 1) {
					// Move to first child
					const nextItem = visibleItems[focusedIndex + 1];
					if (nextItem.level > currentItem.level) {
						setFocusedIndex(focusedIndex + 1);
					}
				}
				break;

			case 'ArrowLeft':
				// Collapse expanded node or move to parent
				if (currentItem.isExpandable && currentItem.isExpanded && currentItem.onToggle) {
					currentItem.onToggle();
				} else if (currentItem.level > 1) {
					// Find parent (first item with lower level before current)
					for (let i = focusedIndex - 1; i >= 0; i--) {
						if (visibleItems[i].level < currentItem.level) {
							setFocusedIndex(i);
							break;
						}
					}
				}
				break;

			case 'Enter':
			case ' ':
				// Select the focused item
				currentItem.onSelect();
				break;

			case 'Home':
				// Move to first item
				setFocusedIndex(0);
				break;

			case 'End':
				// Move to last item
				setFocusedIndex(visibleItems.length - 1);
				break;

			default:
				handled = false;
		}

		if (handled) {
			event.preventDefault();
			event.stopPropagation();
		}
	};
}
