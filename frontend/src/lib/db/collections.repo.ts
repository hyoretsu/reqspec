import { db } from "@/lib/db/db";
import type { CollectionRow } from "@/lib/db/types";

export function listCollections(workspaceId: string): Promise<CollectionRow[]> {
	return db.collections.where("workspaceId").equals(workspaceId).sortBy("order");
}

export async function createCollection(workspaceId: string, name: string): Promise<CollectionRow> {
	const row: CollectionRow = {
		id: crypto.randomUUID(),
		workspaceId,
		name,
		createdAt: Date.now(),
		order: await db.collections.where("workspaceId").equals(workspaceId).count(),
	};
	await db.collections.add(row);
	return row;
}

export async function renameCollection(id: string, name: string): Promise<void> {
	await db.collections.update(id, { name });
}

export async function reorderCollections(orderedIds: string[]): Promise<void> {
	await db.transaction("rw", db.collections, async () => {
		await Promise.all(orderedIds.map((id, index) => db.collections.update(id, { order: index })));
	});
}

/** Delete a collection and cascade its folders + requests. */
export async function deleteCollection(id: string): Promise<void> {
	await db.transaction("rw", db.collections, db.folders, db.requests, async () => {
		await db.requests.where("collectionId").equals(id).delete();
		await db.folders.where("collectionId").equals(id).delete();
		await db.collections.delete(id);
	});
}
