import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

interface SortableListProps {
	ids: string[];
	onReorder: (ids: string[]) => void;
	children: ReactNode;
}

/** Vertical drag-reorder context. Pointer must move 5px before a drag starts, so clicks still work. */
export function SortableList({ ids, onReorder, children }: SortableListProps) {
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	const onDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const from = ids.indexOf(String(active.id));
		const to = ids.indexOf(String(over.id));
		if (from === -1 || to === -1) return;
		onReorder(arrayMove(ids, from, to));
	};

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
			<SortableContext items={ids} strategy={verticalListSortingStrategy}>
				{children}
			</SortableContext>
		</DndContext>
	);
}

export interface DragHandleProps {
	ref: (node: HTMLElement | null) => void;
	[key: string]: unknown;
}

interface SortableItemProps {
	id: string;
	children: (handle: { handleProps: DragHandleProps }) => ReactNode;
}

/** Wraps one sortable row; passes drag-handle props to a dedicated handle element. */
export function SortableItem({ id, children }: SortableItemProps) {
	const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
		useSortable({ id });

	const handleProps: DragHandleProps = {
		ref: setActivatorNodeRef,
		...attributes,
		...listeners,
	};

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
		>
			{children({ handleProps })}
		</div>
	);
}
