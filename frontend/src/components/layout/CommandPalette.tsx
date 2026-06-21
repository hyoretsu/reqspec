import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Modal } from "@/components/ui";
import { MethodBadge } from "@/components/ui/Badge";
import * as requestsRepo from "@/lib/db/requests.repo";
import type { RequestRow } from "@/lib/db/types";
import { useSessionStore } from "@/lib/store/session.store";
import { useTabsStore } from "@/lib/store/tabs.store";

export function CommandPalette() {
	const [open, setOpen] = useState(false);
	const [term, setTerm] = useState("");
	const [results, setResults] = useState<RequestRow[]>([]);
	const workspaceId = useSessionStore(state => state.activeWorkspaceId);
	const openRequest = useTabsStore(state => state.openRequest);

	useHotkeys("mod+k", e => {
		e.preventDefault();
		setOpen(prev => !prev);
	});

	useEffect(() => {
		if (!open) return;
		let active = true;
		requestsRepo.searchRequests(workspaceId, term).then(rows => {
			if (active) setResults(rows);
		});
		return () => {
			active = false;
		};
	}, [open, term, workspaceId]);

	useEffect(() => {
		if (!open) setTerm("");
	}, [open]);

	if (!open) return null;

	const pick = (row: RequestRow) => {
		openRequest(row.id, row.name, row.request);
		setOpen(false);
	};

	return (
		<Modal title="Search requests" onClose={() => setOpen(false)}>
			<input
				autoFocus
				value={term}
				placeholder="Search by name or URL…"
				onChange={e => setTerm(e.target.value)}
				className="mb-2 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-primary"
			/>
			<div className="max-h-72 overflow-auto">
				{results.length === 0 ? (
					<p className="p-3 text-xs text-muted">No matching requests.</p>
				) : (
					results.map(row => (
						<button
							key={row.id}
							type="button"
							onClick={() => pick(row)}
							className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-surface"
						>
							<MethodBadge method={row.request.method} className="w-12 shrink-0" />
							<span className="truncate text-fg">{row.name}</span>
							<span className="ml-auto truncate text-[11px] text-muted">{row.request.url}</span>
						</button>
					))
				)}
			</div>
		</Modal>
	);
}
