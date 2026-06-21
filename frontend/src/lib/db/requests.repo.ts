import { db } from "@/lib/db/db";
import type { RequestRow } from "@/lib/db/types";
import { createEmptyRequest, type RequestModel } from "@/lib/request/model";

export function getRequest(id: string): Promise<RequestRow | undefined> {
	return db.requests.get(id);
}

export function listRequestsByCollection(collectionId: string): Promise<RequestRow[]> {
	return db.requests.where("collectionId").equals(collectionId).sortBy("order");
}

/** Search requests across a workspace by name or URL (case-insensitive). */
export async function searchRequests(workspaceId: string, term: string): Promise<RequestRow[]> {
	const collectionIds = await db.collections.where("workspaceId").equals(workspaceId).primaryKeys();
	const rows = await db.requests.where("collectionId").anyOf(collectionIds).toArray();
	const q = term.trim().toLowerCase();
	if (q === "") return rows.slice(0, 50);
	return rows
		.filter(r => r.name.toLowerCase().includes(q) || r.request.url.toLowerCase().includes(q))
		.slice(0, 50);
}

export async function createRequest(
	collectionId: string,
	name: string,
	folderId: string | null = null,
	request: RequestModel = createEmptyRequest(),
): Promise<RequestRow> {
	const row: RequestRow = {
		id: crypto.randomUUID(),
		collectionId,
		folderId,
		name,
		order: await db.requests.where("collectionId").equals(collectionId).count(),
		updatedAt: Date.now(),
		request,
	};
	await db.requests.add(row);
	return row;
}

export async function updateRequest(
	id: string,
	patch: Partial<Pick<RequestRow, "name" | "folderId" | "request" | "description" | "examples">>,
): Promise<void> {
	await db.requests.update(id, { ...patch, updatedAt: Date.now() });
}

export async function moveRequest(id: string, folderId: string | null, order: number): Promise<void> {
	await db.requests.update(id, { folderId, order });
}

/** Reorder requests within a collection by their new ordered ids. */
export async function reorderRequests(orderedIds: string[]): Promise<void> {
	await db.transaction("rw", db.requests, async () => {
		await Promise.all(orderedIds.map((id, index) => db.requests.update(id, { order: index })));
	});
}

export async function duplicateRequest(id: string): Promise<RequestRow | undefined> {
	const source = await db.requests.get(id);
	if (!source) return undefined;
	const copy: RequestRow = {
		...source,
		id: crypto.randomUUID(),
		name: `${source.name} copy`,
		order: await db.requests.where("collectionId").equals(source.collectionId).count(),
		updatedAt: Date.now(),
	};
	await db.requests.add(copy);
	return copy;
}

export async function deleteRequest(id: string): Promise<void> {
	await db.requests.delete(id);
}
