import { db } from "@/lib/db/db";
import type { TabRow } from "@/lib/db/types";

export function listTabs(workspaceId: string): Promise<TabRow[]> {
	return db.tabs.where("workspaceId").equals(workspaceId).sortBy("order");
}

export async function putTab(tab: TabRow): Promise<void> {
	await db.tabs.put(tab);
}

export async function deleteTab(id: string): Promise<void> {
	await db.tabs.delete(id);
}

export async function reorderTabs(orderedIds: string[]): Promise<void> {
	await db.transaction("rw", db.tabs, async () => {
		await Promise.all(orderedIds.map((id, index) => db.tabs.update(id, { order: index })));
	});
}
