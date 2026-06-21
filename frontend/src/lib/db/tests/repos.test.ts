import { beforeEach, describe, expect, it } from "bun:test";
import { db } from "@/lib/db/db";
import * as collectionsRepo from "@/lib/db/collections.repo";
import * as environmentsRepo from "@/lib/db/environments.repo";
import * as foldersRepo from "@/lib/db/folders.repo";
import * as historyRepo from "@/lib/db/history.repo";
import * as requestsRepo from "@/lib/db/requests.repo";
import { DEFAULT_WORKSPACE_ID } from "@/lib/db/types";
import type { NormalizedResponse } from "@/lib/http/types";
import { createEmptyRequest } from "@/lib/request/model";

const WS = DEFAULT_WORKSPACE_ID;

beforeEach(async () => {
	await Promise.all([
		db.collections.clear(),
		db.folders.clear(),
		db.requests.clear(),
		db.environments.clear(),
		db.globals.clear(),
		db.history.clear(),
	]);
});

describe("collections + requests cascade", () => {
	it("creates, lists and orders collections", async () => {
		await collectionsRepo.createCollection(WS, "A");
		await collectionsRepo.createCollection(WS, "B");
		const list = await collectionsRepo.listCollections(WS);
		expect(list.map(c => c.name)).toEqual(["A", "B"]);
		expect(list.map(c => c.order)).toEqual([0, 1]);
	});

	it("renames a collection", async () => {
		const c = await collectionsRepo.createCollection(WS, "A");
		await collectionsRepo.renameCollection(c.id, "Renamed");
		expect((await collectionsRepo.listCollections(WS))[0].name).toBe("Renamed");
	});

	it("cascades deletion to folders and requests", async () => {
		const c = await collectionsRepo.createCollection(WS, "A");
		const f = await foldersRepo.createFolder(c.id, "folder");
		await requestsRepo.createRequest(c.id, "r1", f.id);
		await collectionsRepo.deleteCollection(c.id);

		expect(await db.collections.count()).toBe(0);
		expect(await db.folders.count()).toBe(0);
		expect(await db.requests.count()).toBe(0);
	});
});

describe("folders cascade", () => {
	it("deletes descendant folders and their requests", async () => {
		const c = await collectionsRepo.createCollection(WS, "A");
		const parent = await foldersRepo.createFolder(c.id, "parent");
		const child = await foldersRepo.createFolder(c.id, "child", parent.id);
		await requestsRepo.createRequest(c.id, "deep", child.id);

		await foldersRepo.deleteFolder(parent.id);

		expect(await db.folders.count()).toBe(0);
		expect(await db.requests.count()).toBe(0);
	});
});

describe("requests", () => {
	it("updates request fields and bumps updatedAt", async () => {
		const c = await collectionsRepo.createCollection(WS, "A");
		const r = await requestsRepo.createRequest(c.id, "r1");
		const model = { ...createEmptyRequest(), url: "https://x.com" };
		await requestsRepo.updateRequest(r.id, { name: "r2", request: model });

		const updated = await requestsRepo.getRequest(r.id);
		expect(updated?.name).toBe("r2");
		expect(updated?.request.url).toBe("https://x.com");
		expect(updated?.updatedAt).toBeGreaterThanOrEqual(r.updatedAt);
	});

	it("deletes a single request", async () => {
		const c = await collectionsRepo.createCollection(WS, "A");
		const r = await requestsRepo.createRequest(c.id, "r1");
		await requestsRepo.deleteRequest(r.id);
		expect(await requestsRepo.getRequest(r.id)).toBeUndefined();
	});
});

describe("environments + globals", () => {
	it("upserts environment variables", async () => {
		const env = await environmentsRepo.createEnvironment(WS, "Prod");
		await environmentsRepo.setEnvironmentVariables(env.id, [
			{ id: "1", key: "host", value: "x", enabled: true },
		]);
		const fetched = await environmentsRepo.getEnvironment(env.id);
		expect(fetched?.variables).toHaveLength(1);
		expect(fetched?.variables[0].key).toBe("host");
	});

	it("scopes environments to a workspace", async () => {
		await environmentsRepo.createEnvironment(WS, "A");
		await environmentsRepo.createEnvironment("other-ws", "B");
		expect(await environmentsRepo.listEnvironments(WS)).toHaveLength(1);
		expect(await environmentsRepo.listEnvironments("other-ws")).toHaveLength(1);
	});

	it("lazily creates and persists globals", async () => {
		const first = await environmentsRepo.getGlobals();
		expect(first.variables).toEqual([]);
		await environmentsRepo.setGlobals([{ id: "1", key: "g", value: "1", enabled: true }]);
		expect((await environmentsRepo.getGlobals()).variables[0].key).toBe("g");
	});

	it("deletes an environment", async () => {
		const env = await environmentsRepo.createEnvironment(WS, "Temp");
		await environmentsRepo.deleteEnvironment(env.id);
		expect(await environmentsRepo.listEnvironments(WS)).toHaveLength(0);
	});
});

describe("history", () => {
	const response: NormalizedResponse = {
		status: 200,
		statusText: "OK",
		headers: [],
		bodyText: "",
		bodyBytes: 0,
		contentType: undefined,
		cookies: [],
		timeMs: 5,
	};

	it("adds and lists history newest-first", async () => {
		const req = createEmptyRequest();
		await historyRepo.addHistory({ name: "first", request: { ...req, url: "a" }, response });
		await new Promise(r => setTimeout(r, 2));
		await historyRepo.addHistory({ name: "second", request: { ...req, url: "b" }, response });

		const list = await historyRepo.listHistory();
		expect(list.map(h => h.name)).toEqual(["second", "first"]);
	});

	it("clears history", async () => {
		await historyRepo.addHistory({ name: "x", request: createEmptyRequest(), response });
		await historyRepo.clearHistory();
		expect(await historyRepo.listHistory()).toHaveLength(0);
	});
});
