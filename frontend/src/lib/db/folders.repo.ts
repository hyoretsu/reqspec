import { db } from "@/lib/db/db";
import type { FolderRow } from "@/lib/db/types";

export function listFoldersByCollection(collectionId: string): Promise<FolderRow[]> {
	return db.folders.where("collectionId").equals(collectionId).sortBy("order");
}

export async function createFolder(
	collectionId: string,
	name: string,
	parentFolderId: string | null = null,
): Promise<FolderRow> {
	const row: FolderRow = {
		id: crypto.randomUUID(),
		collectionId,
		parentFolderId,
		name,
		order: await db.folders.where("collectionId").equals(collectionId).count(),
	};
	await db.folders.add(row);
	return row;
}

export async function renameFolder(id: string, name: string): Promise<void> {
	await db.folders.update(id, { name });
}

/** Delete a folder, its descendant folders, and all requests within them. */
export async function deleteFolder(id: string): Promise<void> {
	await db.transaction("rw", db.folders, db.requests, async () => {
		const all = await db.folders.toArray();
		const toDelete = new Set<string>([id]);
		let changed = true;
		while (changed) {
			changed = false;
			for (const folder of all) {
				if (folder.parentFolderId && toDelete.has(folder.parentFolderId) && !toDelete.has(folder.id)) {
					toDelete.add(folder.id);
					changed = true;
				}
			}
		}
		const ids = [...toDelete];
		await db.requests.where("folderId").anyOf(ids).delete();
		await db.folders.bulkDelete(ids);
	});
}
