import { describe, expect, test } from "bun:test";
import type { FolderRow, RequestRow } from "@/lib/db/types";
import { createEmptyRequest } from "@/lib/request/model";
import { flattenRunItems } from "@/lib/runner/flatten";

function folder(
	id: string,
	parentFolderId: string | null,
	order: number,
): FolderRow {
	return { id, collectionId: "c", parentFolderId, name: id, order };
}

function request(
	id: string,
	folderId: string | null,
	order: number,
): RequestRow {
	return {
		id,
		collectionId: "c",
		folderId,
		name: `req-${id}`,
		order,
		updatedAt: 0,
		request: createEmptyRequest(),
	};
}

describe("flattenRunItems", () => {
	test("emits root requests in order then descends into folders depth-first", () => {
		const folders = [
			folder("f2", null, 1),
			folder("f1", null, 0),
			folder("f1a", "f1", 0),
		];
		const requests = [
			request("r2", null, 1),
			request("r1", null, 0),
			request("rf1", "f1", 0),
			request("rf1a", "f1a", 0),
			request("rf2", "f2", 0),
		];
		const items = flattenRunItems(folders, requests);
		expect(items.map((i) => i.id)).toEqual(["r1", "r2", "rf1", "rf1a", "rf2"]);
		expect(items[0]).toMatchObject({ id: "r1", name: "req-r1" });
	});

	test("scopes to a folder and its descendants", () => {
		const folders = [
			folder("f1", null, 0),
			folder("f1a", "f1", 0),
			folder("f2", null, 1),
		];
		const requests = [
			request("r1", null, 0),
			request("rf1", "f1", 0),
			request("rf1a", "f1a", 0),
			request("rf2", "f2", 0),
		];
		const items = flattenRunItems(folders, requests, { folderId: "f1" });
		expect(items.map((i) => i.id)).toEqual(["rf1", "rf1a"]);
	});

	test("returns no items for an empty collection", () => {
		expect(flattenRunItems([], [])).toEqual([]);
	});
});
