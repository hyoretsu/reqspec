import { beforeEach, describe, expect, it } from "bun:test";
import { db } from "@/lib/db/db";
import * as collectionsRepo from "@/lib/db/collections.repo";
import * as environmentsRepo from "@/lib/db/environments.repo";
import * as foldersRepo from "@/lib/db/folders.repo";
import * as requestsRepo from "@/lib/db/requests.repo";
import { DEFAULT_WORKSPACE_ID } from "@/lib/db/types";
import { importPostmanText } from "@/lib/import/persist";

const WS = DEFAULT_WORKSPACE_ID;

beforeEach(async () => {
	await Promise.all([
		db.collections.clear(),
		db.folders.clear(),
		db.requests.clear(),
		db.environments.clear(),
	]);
});

const collectionJson = JSON.stringify({
	info: { name: "Sample API" },
	variable: [{ key: "baseUrl", value: "https://api.test", enabled: true }],
	item: [
		{
			name: "Users",
			item: [{ name: "List", request: { method: "GET", url: "https://api.test/users" } }],
		},
		{ name: "Health", request: { method: "GET", url: "https://api.test/health" } },
	],
});

describe("importPostmanText — collection", () => {
	it("creates the collection, nested folders, requests and a variables environment", async () => {
		const result = await importPostmanText(WS, collectionJson);
		expect(result).toEqual({ kind: "collection", name: "Sample API", requestCount: 2 });

		const collections = await collectionsRepo.listCollections(WS);
		expect(collections).toHaveLength(1);

		const folders = await foldersRepo.listFoldersByCollection(collections[0].id);
		expect(folders.map(f => f.name)).toEqual(["Users"]);

		const requests = await requestsRepo.listRequestsByCollection(collections[0].id);
		expect(requests.map(r => r.name).sort()).toEqual(["Health", "List"]);
		const list = requests.find(r => r.name === "List");
		expect(list?.folderId).toBe(folders[0].id);

		const envs = await environmentsRepo.listEnvironments(WS);
		expect(envs).toHaveLength(1);
		expect(envs[0].variables[0]).toMatchObject({ key: "baseUrl", value: "https://api.test" });
	});

	it("does not create an environment when there are no collection variables", async () => {
		await importPostmanText(WS, JSON.stringify({ info: { name: "NoVars" }, item: [] }));
		expect(await environmentsRepo.listEnvironments(WS)).toHaveLength(0);
	});
});

describe("importPostmanText — environment", () => {
	it("creates an environment with its variables", async () => {
		const result = await importPostmanText(
			WS,
			JSON.stringify({
				_postman_variable_scope: "environment",
				name: "Staging",
				values: [{ key: "token", value: "abc", enabled: true }],
			}),
		);
		expect(result).toEqual({ kind: "environment", name: "Staging", requestCount: 0 });
		const envs = await environmentsRepo.listEnvironments(WS);
		expect(envs).toHaveLength(1);
		expect(envs[0].name).toBe("Staging");
	});
});

describe("importPostmanText — errors", () => {
	it("throws on invalid JSON", async () => {
		await expect(importPostmanText(WS, "{not json")).rejects.toThrow(/Invalid JSON/);
	});

	it("throws on an unrecognized shape", async () => {
		await expect(importPostmanText(WS, JSON.stringify({ nope: 1 }))).rejects.toThrow(/Unrecognized/);
	});
});
