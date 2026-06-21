import { db } from "@/lib/db/db";
import { GLOBALS_ID, type EnvironmentRow, type GlobalsRow, type VariableRow } from "@/lib/db/types";

export function listEnvironments(workspaceId: string): Promise<EnvironmentRow[]> {
	return db.environments.where("workspaceId").equals(workspaceId).sortBy("createdAt");
}

export function getEnvironment(id: string): Promise<EnvironmentRow | undefined> {
	return db.environments.get(id);
}

export async function createEnvironment(workspaceId: string, name: string): Promise<EnvironmentRow> {
	const row: EnvironmentRow = {
		id: crypto.randomUUID(),
		workspaceId,
		name,
		createdAt: Date.now(),
		variables: [],
	};
	await db.environments.add(row);
	return row;
}

export async function renameEnvironment(id: string, name: string): Promise<void> {
	await db.environments.update(id, { name });
}

export async function setEnvironmentVariables(id: string, variables: VariableRow[]): Promise<void> {
	await db.environments.update(id, { variables });
}

export async function deleteEnvironment(id: string): Promise<void> {
	await db.environments.delete(id);
}

export async function getGlobals(): Promise<GlobalsRow> {
	const existing = await db.globals.get(GLOBALS_ID);
	if (existing) return existing;
	const fresh: GlobalsRow = { id: GLOBALS_ID, variables: [] };
	await db.globals.put(fresh);
	return fresh;
}

export async function setGlobals(variables: VariableRow[]): Promise<void> {
	await db.globals.put({ id: GLOBALS_ID, variables });
}
