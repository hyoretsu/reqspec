import { IconButton, MethodBadge, StatusBadge } from "@/components/ui";
import type { HistoryRow } from "@/lib/db/types";
import { useTabsStore } from "@/lib/store/tabs.store";

interface HistoryItemProps {
	row: HistoryRow;
	onDelete: () => void;
}

export function HistoryItem({ row, onDelete }: HistoryItemProps) {
	const openLoaded = useTabsStore(state => state.openLoaded);

	const reopen = () => {
		openLoaded({ requestId: null, name: row.name, draft: row.request, dirty: false, response: row.response });
	};

	return (
		<div className="group flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-surface">
			<button type="button" onClick={reopen} className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
				<span className="flex w-full items-center gap-2">
					<MethodBadge method={row.method} className="w-12 shrink-0" />
					<span className="truncate text-xs text-fg">{row.url || row.name}</span>
				</span>
				<span className="flex items-center gap-2 pl-14 text-[11px] text-muted">
					<StatusBadge status={row.response.status} statusText={row.response.statusText} />
					<span>{new Date(row.createdAt).toLocaleTimeString()}</span>
				</span>
			</button>
			<IconButton label="Delete history entry" onClick={onDelete} className="opacity-0 group-hover:opacity-100">
				✕
			</IconButton>
		</div>
	);
}
