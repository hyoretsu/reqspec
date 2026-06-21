import { Button, EmptyState, Spinner } from "@/components/ui";
import { SortableItem, SortableList } from "@/components/ui/Sortable";
import { CollectionNode } from "@/components/collections/CollectionsTree/CollectionNode";
import { useCollections, useCollectionMutations } from "@/hooks/queries/use-collections";
import { useImportPostman } from "@/hooks/use-import-postman";
import { useSessionStore } from "@/lib/store/session.store";
import { promptDialog } from "@/lib/ui/modal";

export function CollectionsTree() {
	const workspaceId = useSessionStore(state => state.activeWorkspaceId);
	const { data: collections, isLoading } = useCollections(workspaceId);
	const { create, reorder } = useCollectionMutations();
	const { inputRef, openPicker, onFilesSelected } = useImportPostman();

	const addCollection = async () => {
		const name = await promptDialog({
			title: "New collection",
			placeholder: "Collection name",
			defaultValue: "New collection",
		});
		if (name) await create.mutateAsync({ workspaceId, name });
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
				<h2 className="text-sm font-semibold text-fg">Collections</h2>
				<div className="flex gap-2">
					<input
						ref={inputRef}
						type="file"
						accept="application/json,.json"
						multiple
						className="hidden"
						onChange={event => onFilesSelected(event.target.files)}
					/>
					<Button size="sm" variant="secondary" onClick={openPicker} title="Import a Postman collection or environment">
						Import
					</Button>
					<Button size="sm" variant="secondary" onClick={addCollection}>
						+ New
					</Button>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto p-1">
				{isLoading ? (
					<div className="flex justify-center p-4 text-muted">
						<Spinner />
					</div>
				) : collections?.length ? (
					<SortableList ids={collections.map(c => c.id)} onReorder={ids => reorder.mutate(ids)}>
						{collections.map(collection => (
							<SortableItem key={collection.id} id={collection.id}>
								{() => <CollectionNode collection={collection} />}
							</SortableItem>
						))}
					</SortableList>
				) : (
					<EmptyState
						title="No collections"
						description="Create a collection to organize your requests."
						action={
							<Button size="sm" onClick={addCollection}>
								Create collection
							</Button>
						}
					/>
				)}
			</div>
		</div>
	);
}
