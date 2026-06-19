import { db } from "@/lib/db/db";
import type { RequestRow } from "@/lib/db/types";
import { createEmptyRequest, type RequestModel } from "@/lib/request/model";

export function getRequest(id: string): Promise<RequestRow | undefined> {
	return db.requests.get(id);
}

export function listRequestsByCollection(collectionId: string): Promise<RequestRow[]> {
	return db.requests.where("collectionId").equals(collectionId).sortBy("order");
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
	patch: Partial<Pick<RequestRow, "name" | "folderId" | "request">>,
): Promise<void> {
	await db.requests.update(id, { ...patch, updatedAt: Date.now() });
}

export async function moveRequest(id: string, folderId: string | null, order: number): Promise<void> {
	await db.requests.update(id, { folderId, order });
}

export async function deleteRequest(id: string): Promise<void> {
	await db.requests.delete(id);
}
