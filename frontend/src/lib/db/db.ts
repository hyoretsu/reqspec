import Dexie, { type EntityTable } from "dexie";
import type {
	CollectionRow,
	EnvironmentRow,
	FolderRow,
	GlobalsRow,
	HistoryRow,
	RequestRow,
} from "@/lib/db/types";

export class ReqspecDB extends Dexie {
	collections!: EntityTable<CollectionRow, "id">;
	folders!: EntityTable<FolderRow, "id">;
	requests!: EntityTable<RequestRow, "id">;
	environments!: EntityTable<EnvironmentRow, "id">;
	globals!: EntityTable<GlobalsRow, "id">;
	history!: EntityTable<HistoryRow, "id">;

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
	}
}

export const db = new ReqspecDB();
