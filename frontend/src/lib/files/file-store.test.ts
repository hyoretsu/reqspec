import { describe, expect, it } from "bun:test";
import { getFile, hasFile, removeFile, setFile } from "@/lib/files/file-store";

describe("file-store", () => {
	it("stores and retrieves a file by id", () => {
		const file = new File(["data"], "a.txt", { type: "text/plain" });
		setFile("id-1", file);
		expect(hasFile("id-1")).toBe(true);
		expect(getFile("id-1")).toBe(file);
	});

	it("returns undefined for an unknown id", () => {
		expect(getFile("missing")).toBeUndefined();
		expect(hasFile("missing")).toBe(false);
	});

	it("overwrites an existing id", () => {
		const a = new File(["a"], "a.txt");
		const b = new File(["b"], "b.txt");
		setFile("id-2", a);
		setFile("id-2", b);
		expect(getFile("id-2")).toBe(b);
	});

	it("removes a stored file", () => {
		setFile("id-3", new File(["x"], "x.txt"));
		removeFile("id-3");
		expect(hasFile("id-3")).toBe(false);
	});
});
