import { db } from "@/lib/db/db";
import type { HistoryRow } from "@/lib/db/types";
import type { NormalizedResponse } from "@/lib/http/types";
import type { RequestModel } from "@/lib/request/model";

export interface AddHistoryInput {
	name: string;
	request: RequestModel;
	response: NormalizedResponse;
}

export async function addHistory(input: AddHistoryInput): Promise<HistoryRow> {
	const row: HistoryRow = {
		id: crypto.randomUUID(),
		createdAt: Date.now(),
		name: input.name,
		method: input.request.method,
		url: input.request.url,
		status: input.response.status,
		request: input.request,
		response: input.response,
	};
	await db.history.add(row);
	return row;
}

/** Most-recent first. */
export function listHistory(limit = 100): Promise<HistoryRow[]> {
	return db.history.orderBy("createdAt").reverse().limit(limit).toArray();
}

export function getHistory(id: string): Promise<HistoryRow | undefined> {
	return db.history.get(id);
}

export async function deleteHistory(id: string): Promise<void> {
	await db.history.delete(id);
}

export async function clearHistory(): Promise<void> {
	await db.history.clear();
}
