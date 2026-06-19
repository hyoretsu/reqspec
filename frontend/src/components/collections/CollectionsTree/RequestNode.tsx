import clsx from "clsx";
import { IconButton, MethodBadge } from "@/components/ui";
import type { RequestRow } from "@/lib/db/types";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

interface RequestNodeProps {
	row: RequestRow;
	onDelete: () => void;
}

export function RequestNode({ row, onDelete }: RequestNodeProps) {
	const activeId = useActiveRequestStore(state => state.requestId);
	const open = useActiveRequestStore(state => state.open);

	return (
		<div
			className={clsx(
				"group flex items-center gap-2 rounded px-2 py-1 pl-6 text-sm transition-colors hover:bg-surface",
				row.id === activeId ? "bg-surface" : "",
			)}
		>
			<button
				type="button"
				onClick={() => open(row.id, row.name, row.request)}
				className="flex min-w-0 flex-1 items-center gap-2 text-left"
			>
				<MethodBadge method={row.request.method} className="w-12 shrink-0" />
				<span className="truncate text-fg">{row.name}</span>
			</button>
			<IconButton
				label="Delete request"
				onClick={onDelete}
				className="opacity-0 group-hover:opacity-100"
			>
				✕
			</IconButton>
		</div>
	);
}
