import Dexie, { type EntityTable } from "dexie";
import {
	type CollectionRow,
	DEFAULT_WORKSPACE_ID,
	type EnvironmentRow,
	type FolderRow,
	type GlobalsRow,
	type HistoryRow,
	type RequestRow,
	type TabRow,
	type WorkspaceRow,
} from "@/lib/db/types";

export class ReqspecDB extends Dexie {
	workspaces!: EntityTable<WorkspaceRow, "id">;
	collections!: EntityTable<CollectionRow, "id">;
	folders!: EntityTable<FolderRow, "id">;
	requests!: EntityTable<RequestRow, "id">;
	environments!: EntityTable<EnvironmentRow, "id">;
	globals!: EntityTable<GlobalsRow, "id">;
	history!: EntityTable<HistoryRow, "id">;
	tabs!: EntityTable<TabRow, "id">;

	constructor() {
		super("reqspec");

		this.version(1).stores({
			collections: "id, name, createdAt, order",
			folders: "id, collectionId, parentFolderId, name, order",
			requests: "id, collectionId, folderId, name, order, updatedAt",
			environments: "id, name, createdAt",
			globals: "id",
			history: "id, createdAt, url, method, status",
		});

		// v2: workspaces + tabs; scope collections/environments by workspace.
		this.version(2)
			.stores({
				workspaces: "id, order, createdAt",
				collections: "id, workspaceId, name, createdAt, order",
				environments: "id, workspaceId, name, createdAt",
				tabs: "id, workspaceId, order",
			})
			.upgrade(async tx => {
				await tx.table<WorkspaceRow, string>("workspaces").put({
					id: DEFAULT_WORKSPACE_ID,
					name: "My Workspace",
					createdAt: Date.now(),
					order: 0,
				});
				await tx
					.table<CollectionRow, string>("collections")
					.toCollection()
					.modify(row => {
						row.workspaceId = DEFAULT_WORKSPACE_ID;
					});
				await tx
					.table<EnvironmentRow, string>("environments")
					.toCollection()
					.modify(row => {
						row.workspaceId = DEFAULT_WORKSPACE_ID;
					});
			});
	}
}

export const db = new ReqspecDB();

/** Ensure at least the default workspace exists (fresh installs have no upgrade run). */
export async function ensureDefaultWorkspace(): Promise<void> {
	const existing = await db.workspaces.get(DEFAULT_WORKSPACE_ID);
	if (!existing) {
		await db.workspaces.put({
			id: DEFAULT_WORKSPACE_ID,
			name: "My Workspace",
			createdAt: Date.now(),
			order: 0,
		});
	}
}
