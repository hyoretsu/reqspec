import { Button, EmptyState, Spinner } from "@/components/ui";
import { CollectionNode } from "@/components/collections/CollectionsTree/CollectionNode";
import { useCollections, useCollectionMutations } from "@/hooks/queries/use-collections";
import { promptDialog } from "@/lib/ui/modal";

export function CollectionsTree() {
	const { data: collections, isLoading } = useCollections();
	const { create } = useCollectionMutations();

	const addCollection = async () => {
		const name = await promptDialog({
			title: "New collection",
			placeholder: "Collection name",
			defaultValue: "New collection",
		});
		if (name) await create.mutateAsync(name);
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<h2 className="text-sm font-semibold text-fg">Collections</h2>
				<Button size="sm" variant="secondary" onClick={addCollection}>
					+ New
				</Button>
			</div>

			<div className="min-h-0 flex-1 overflow-auto p-1">
				{isLoading ? (
					<div className="flex justify-center p-4 text-muted">
						<Spinner />
					</div>
				) : collections?.length ? (
					collections.map(collection => <CollectionNode key={collection.id} collection={collection} />)
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
