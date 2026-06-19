import { Button, EmptyState, Spinner } from "@/components/ui";
import { HistoryItem } from "@/components/history/HistoryList/HistoryItem";
import { useHistory, useHistoryMutations } from "@/hooks/queries/use-history";
import { confirmDialog } from "@/lib/ui/modal";

export function HistoryList() {
	const { data: history, isLoading } = useHistory();
	const { remove, clear } = useHistoryMutations();

	const clearAll = async () => {
		const ok = await confirmDialog({
			title: "Clear history?",
			message: "All recorded requests will be removed.",
			danger: true,
			confirmLabel: "Clear",
		});
		if (ok) await clear.mutateAsync();
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<h2 className="text-sm font-semibold text-fg">History</h2>
				{history?.length ? (
					<Button size="sm" variant="secondary" onClick={clearAll}>
						Clear
					</Button>
				) : null}
			</div>

			<div className="min-h-0 flex-1 overflow-auto p-1">
				{isLoading ? (
					<div className="flex justify-center p-4 text-muted">
						<Spinner />
					</div>
				) : history?.length ? (
					history.map(row => <HistoryItem key={row.id} row={row} onDelete={() => remove.mutate(row.id)} />)
				) : (
					<EmptyState title="No history yet" description="Sent requests will appear here." />
				)}
			</div>
		</div>
	);
}
