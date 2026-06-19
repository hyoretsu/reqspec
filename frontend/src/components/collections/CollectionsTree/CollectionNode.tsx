import { useState } from "react";
import { IconButton } from "@/components/ui";
import { RequestNode } from "@/components/collections/CollectionsTree/RequestNode";
import { useRequests } from "@/hooks/queries/use-collections";
import { useRequestMutations } from "@/hooks/queries/use-requests";
import { useCollectionMutations } from "@/hooks/queries/use-collections";
import type { CollectionRow } from "@/lib/db/types";
import { confirmDialog, promptDialog } from "@/lib/ui/modal";

export function CollectionNode({ collection }: { collection: CollectionRow }) {
	const [expanded, setExpanded] = useState(true);
	const { data: requests } = useRequests(collection.id);
	const requestMutations = useRequestMutations(collection.id);
	const collectionMutations = useCollectionMutations();

	const addRequest = async () => {
		const name = await promptDialog({ title: "New request", placeholder: "Request name", defaultValue: "New request" });
		if (name) await requestMutations.create.mutateAsync({ name });
	};

	const rename = async () => {
		const name = await promptDialog({ title: "Rename collection", defaultValue: collection.name });
		if (name) await collectionMutations.rename.mutateAsync({ id: collection.id, name });
	};

	const remove = async () => {
		const ok = await confirmDialog({
			title: "Delete collection?",
			message: `"${collection.name}" and all its requests will be deleted.`,
			danger: true,
			confirmLabel: "Delete",
		});
		if (ok) await collectionMutations.remove.mutateAsync(collection.id);
	};

	return (
		<div>
			<div className="group flex items-center gap-1 rounded px-2 py-1 hover:bg-surface">
				<button
					type="button"
					onClick={() => setExpanded(prev => !prev)}
					className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium text-fg"
				>
					<span aria-hidden className="w-3 text-muted">{expanded ? "▾" : "▸"}</span>
					<span className="truncate">{collection.name}</span>
				</button>
				<div className="flex opacity-0 group-hover:opacity-100">
					<IconButton label="Add request" onClick={addRequest}>+</IconButton>
					<IconButton label="Rename collection" onClick={rename}>✎</IconButton>
					<IconButton label="Delete collection" onClick={remove}>✕</IconButton>
				</div>
			</div>

			{expanded ? (
				<div className="flex flex-col">
					{requests?.length ? (
						requests.map(row => (
							<RequestNode
								key={row.id}
								row={row}
								onDelete={() => requestMutations.remove.mutate(row.id)}
							/>
						))
					) : (
						<p className="px-2 py-1 pl-6 text-xs text-muted">No requests</p>
					)}
				</div>
			) : null}
		</div>
	);
}
