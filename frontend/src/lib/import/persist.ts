import * as collectionsRepo from "@/lib/db/collections.repo";
import * as environmentsRepo from "@/lib/db/environments.repo";
import * as foldersRepo from "@/lib/db/folders.repo";
import * as requestsRepo from "@/lib/db/requests.repo";
import {
	type ImportedCollection,
	type ImportedEnvironment,
	parsePostman,
	type PostmanImport,
} from "@/lib/import/postman";

export interface ImportResult {
	kind: "collection" | "environment";
	name: string;
	requestCount: number;
}

async function persistCollection(workspaceId: string, parsed: ImportedCollection): Promise<ImportResult> {
	const collection = await collectionsRepo.createCollection(workspaceId, parsed.name);

	// Create folders lazily, keyed by their full path, so each segment is made once.
	const folderIds = new Map<string, string>();
	const ensureFolder = async (path: string[]): Promise<string | null> => {
		let parentId: string | null = null;
		let key = "";
		for (const segment of path) {
			key = key === "" ? segment : `${key}/${segment}`;
			let id = folderIds.get(key);
			if (!id) {
				const folder = await foldersRepo.createFolder(collection.id, segment, parentId);
				id = folder.id;
				folderIds.set(key, id);
			}
			parentId = id;
		}
		return parentId;
	};

	for (const item of parsed.requests) {
		const folderId = await ensureFolder(item.folderPath);
		await requestsRepo.createRequest(collection.id, item.name, folderId, item.request);
	}

	if (parsed.variables.length > 0) {
		const env = await environmentsRepo.createEnvironment(workspaceId, parsed.name);
		await environmentsRepo.setEnvironmentVariables(env.id, parsed.variables);
	}

	return { kind: "collection", name: parsed.name, requestCount: parsed.requests.length };
}

async function persistEnvironment(workspaceId: string, parsed: ImportedEnvironment): Promise<ImportResult> {
	const env = await environmentsRepo.createEnvironment(workspaceId, parsed.name);
	await environmentsRepo.setEnvironmentVariables(env.id, parsed.variables);
	return { kind: "environment", name: parsed.name, requestCount: 0 };
}

async function persist(workspaceId: string, parsed: PostmanImport): Promise<ImportResult> {
	return parsed.kind === "collection"
		? persistCollection(workspaceId, parsed.collection)
		: persistEnvironment(workspaceId, parsed.environment);
}

/** Parse and persist a single Postman export file's text into the given workspace. */
export async function importPostmanText(workspaceId: string, text: string): Promise<ImportResult> {
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		throw new Error("Invalid JSON file.");
	}
	return persist(workspaceId, parsePostman(json));
}
