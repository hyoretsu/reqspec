import clsx from "clsx";
import { useState } from "react";
import { IconButton, MethodBadge } from "@/components/ui";
import type { DragHandleProps } from "@/components/ui/Sortable";
import type { RequestRow } from "@/lib/db/types";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import { useTabsStore } from "@/lib/store/tabs.store";

interface RequestNodeProps {
	row: RequestRow;
	handleProps?: DragHandleProps;
	onRename: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
}

export function RequestNode({
	row,
	handleProps,
	onRename,
	onDuplicate,
	onDelete,
}: RequestNodeProps) {
	const [showExamples, setShowExamples] = useState(false);
	const activeId = useActiveRequestStore((state) => state.requestId);
	const openRequest = useTabsStore((state) => state.openRequest);
	const openLoaded = useTabsStore((state) => state.openLoaded);
	const examples = row.examples ?? [];

	return (
		<div>
			<div
				className={clsx(
					"group flex items-center gap-1 rounded px-2 py-1 pl-2 text-sm transition-colors hover:bg-surface",
					row.id === activeId ? "bg-surface" : "",
				)}
			>
				<span
					{...handleProps}
					className="cursor-grab text-muted opacity-0 group-hover:opacity-100"
					aria-label="Drag to reorder"
				>
					⠿
				</span>
				{examples.length > 0 ? (
					<button
						type="button"
						onClick={() => setShowExamples((p) => !p)}
						aria-label="Toggle examples"
						className="w-3 text-muted"
					>
						{showExamples ? "▾" : "▸"}
					</button>
				) : (
					<span className="w-3" />
				)}
				<button
					type="button"
					onClick={() => openRequest(row.id, row.name, row.request)}
					className="flex min-w-0 flex-1 items-center gap-2 text-left"
				>
					{row.request.protocol && row.request.protocol !== "http" ? (
						<span className="w-12 shrink-0 font-mono text-xs font-bold uppercase text-primary">
							{row.request.protocol === "websocket"
								? "WS"
								: row.request.protocol}
						</span>
					) : (
						<MethodBadge
							method={row.request.method}
							className="w-12 shrink-0"
						/>
					)}
					<span className="truncate text-fg">{row.name}</span>
				</button>
				<div className="flex opacity-0 group-hover:opacity-100">
					<IconButton label="Rename request" onClick={onRename}>
						✎
					</IconButton>
					<IconButton label="Duplicate request" onClick={onDuplicate}>
						⧉
					</IconButton>
					<IconButton label="Delete request" onClick={onDelete}>
						✕
					</IconButton>
				</div>
			</div>

			{showExamples
				? examples.map((ex) => (
						<button
							key={ex.id}
							type="button"
							onClick={() =>
								openLoaded({
									requestId: null,
									name: `${row.name} · ${ex.name}`,
									draft: ex.request,
									dirty: false,
									response: ex.response,
								})
							}
							className="flex w-full items-center gap-2 rounded px-2 py-1 pl-12 text-left text-xs text-muted hover:bg-surface hover:text-fg"
						>
							<span className="truncate">📄 {ex.name}</span>
						</button>
					))
				: null}
		</div>
	);
}
