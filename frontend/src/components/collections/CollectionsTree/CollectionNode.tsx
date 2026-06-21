import { useState } from "react";
import { IconButton } from "@/components/ui";
import { SortableItem, SortableList } from "@/components/ui/Sortable";
import { RequestNode } from "@/components/collections/CollectionsTree/RequestNode";
import { useCollectionMutations, useFolders, useRequests } from "@/hooks/queries/use-collections";
import { useFolderMutations } from "@/hooks/queries/use-folders";
import { useRequestMutations } from "@/hooks/queries/use-requests";
import type { CollectionRow, RequestRow } from "@/lib/db/types";
import { confirmDialog, promptDialog } from "@/lib/ui/modal";

export function CollectionNode({ collection }: { collection: CollectionRow }) {
	const [expanded, setExpanded] = useState(true);
	const { data: requests } = useRequests(collection.id);
	const { data: folders } = useFolders(collection.id);
	const requestMutations = useRequestMutations(collection.id);
	const folderMutations = useFolderMutations(collection.id);
	const collectionMutations = useCollectionMutations();

	const addRequest = async (folderId: string | null = null) => {
		const name = await promptDialog({ title: "New request", placeholder: "Request name", defaultValue: "New request" });
		if (name) await requestMutations.create.mutateAsync({ name, folderId });
	};

	const addFolder = async () => {
		const name = await promptDialog({ title: "New folder", placeholder: "Folder name", defaultValue: "New folder" });
		if (name) await folderMutations.create.mutateAsync({ name });
	};

	const renameCollection = async () => {
		const name = await promptDialog({ title: "Rename collection", defaultValue: collection.name });
		if (name) await collectionMutations.rename.mutateAsync({ id: collection.id, name });
	};

	const removeCollection = async () => {
		const ok = await confirmDialog({
			title: "Delete collection?",
			message: `"${collection.name}" and all its requests will be deleted.`,
			danger: true,
			confirmLabel: "Delete",
		});
		if (ok) await collectionMutations.remove.mutateAsync(collection.id);
	};

	const renameRequest = async (row: RequestRow) => {
		const name = await promptDialog({ title: "Rename request", defaultValue: row.name });
		if (name) await requestMutations.update.mutateAsync({ id: row.id, patch: { name } });
	};

	const all = requests ?? [];
	const topLevel = all.filter(r => !r.folderId);

	const renderRequest = (row: RequestRow, handleProps?: Parameters<typeof RequestNode>[0]["handleProps"]) => (
		<RequestNode
			row={row}
			handleProps={handleProps}
			onRename={() => renameRequest(row)}
			onDuplicate={() => requestMutations.duplicate.mutate(row.id)}
			onDelete={() => requestMutations.remove.mutate(row.id)}
		/>
	);

	return (
		<div>
			<div className="group flex items-center gap-1 rounded px-2 py-1 hover:bg-surface">
				<button
					type="button"
					onClick={() => setExpanded(prev => !prev)}
					className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium text-fg"
				>
					<span aria-hidden className="w-3 text-muted">
						{expanded ? "▾" : "▸"}
					</span>
					<span className="truncate">{collection.name}</span>
				</button>
				<div className="flex opacity-0 group-hover:opacity-100">
					<IconButton label="Add request" onClick={() => addRequest(null)}>
						+
					</IconButton>
					<IconButton label="Add folder" onClick={addFolder}>
						🗀
					</IconButton>
					<IconButton label="Rename collection" onClick={renameCollection}>
						✎
					</IconButton>
					<IconButton label="Delete collection" onClick={removeCollection}>
						✕
					</IconButton>
				</div>
			</div>

			{expanded ? (
				<div className="flex flex-col">
					{folders?.map(folder => {
						const folderRequests = all.filter(r => r.folderId === folder.id);
						return (
							<div key={folder.id}>
								<div className="group flex items-center gap-1 px-2 py-1 pl-5 text-xs font-medium text-muted hover:bg-surface">
									<span className="flex-1 truncate">🗀 {folder.name}</span>
									<div className="flex opacity-0 group-hover:opacity-100">
										<IconButton label="Add request to folder" onClick={() => addRequest(folder.id)}>
											+
										</IconButton>
										<IconButton
											label="Rename folder"
											onClick={async () => {
												const name = await promptDialog({ title: "Rename folder", defaultValue: folder.name });
												if (name) await folderMutations.rename.mutateAsync({ id: folder.id, name });
											}}
										>
											✎
										</IconButton>
										<IconButton label="Delete folder" onClick={() => folderMutations.remove.mutate(folder.id)}>
											✕
										</IconButton>
									</div>
								</div>
								<div className="pl-3">{folderRequests.map(row => renderRequest(row))}</div>
							</div>
						);
					})}

					{topLevel.length > 0 ? (
						<SortableList
							ids={topLevel.map(r => r.id)}
							onReorder={ids => requestMutations.reorder.mutate(ids)}
						>
							{topLevel.map(row => (
								<SortableItem key={row.id} id={row.id}>
									{({ handleProps }) => renderRequest(row, handleProps)}
								</SortableItem>
							))}
						</SortableList>
					) : null}

					{all.length === 0 ? <p className="px-2 py-1 pl-6 text-xs text-muted">No requests</p> : null}
				</div>
			) : null}
		</div>
	);
}
