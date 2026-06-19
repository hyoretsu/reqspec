import { db } from "@/lib/db/db";
import type { CollectionRow } from "@/lib/db/types";

export function listCollections(): Promise<CollectionRow[]> {
	return db.collections.orderBy("order").toArray();
}

export async function createCollection(name: string): Promise<CollectionRow> {
	const row: CollectionRow = {
		id: crypto.randomUUID(),
		name,
		createdAt: Date.now(),
		order: await db.collections.count(),
	};
	await db.collections.add(row);
	return row;
}

export async function renameCollection(id: string, name: string): Promise<void> {
	await db.collections.update(id, { name });
}

/** Delete a collection and cascade its folders + requests. */
export async function deleteCollection(id: string): Promise<void> {
	await db.transaction("rw", db.collections, db.folders, db.requests, async () => {
		await db.requests.where("collectionId").equals(id).delete();
		await db.folders.where("collectionId").equals(id).delete();
		await db.collections.delete(id);
	});
}
