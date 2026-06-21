import { db, ensureDefaultWorkspace } from "@/lib/db/db";
import type { WorkspaceRow } from "@/lib/db/types";

export async function listWorkspaces(): Promise<WorkspaceRow[]> {
	await ensureDefaultWorkspace();
	return db.workspaces.orderBy("order").toArray();
}

export async function createWorkspace(name: string): Promise<WorkspaceRow> {
	const row: WorkspaceRow = {
		id: crypto.randomUUID(),
		name,
		createdAt: Date.now(),
		order: await db.workspaces.count(),
	};
	await db.workspaces.add(row);
	return row;
}

export async function renameWorkspace(id: string, name: string): Promise<void> {
	await db.workspaces.update(id, { name });
}

/** Delete a workspace and everything scoped to it (collections cascade, environments, tabs). */
export async function deleteWorkspace(id: string): Promise<void> {
	await db.transaction(
		"rw",
		[db.workspaces, db.collections, db.folders, db.requests, db.environments, db.tabs],
		async () => {
			const collectionIds = await db.collections.where("workspaceId").equals(id).primaryKeys();
			await db.requests.where("collectionId").anyOf(collectionIds).delete();
			await db.folders.where("collectionId").anyOf(collectionIds).delete();
			await db.collections.where("workspaceId").equals(id).delete();
			await db.environments.where("workspaceId").equals(id).delete();
			await db.tabs.where("workspaceId").equals(id).delete();
			await db.workspaces.delete(id);
		},
	);
}
