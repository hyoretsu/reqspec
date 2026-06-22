import { describe, expect, it } from "bun:test";
import { createNode, type JsonNode, nodeToValue, parseToNode, serializeNode, valueToNode } from "@/lib/json/builder";

describe("nodeToValue", () => {
	it("converts primitives", () => {
		expect(nodeToValue({ kind: "string", value: "hi" })).toBe("hi");
		expect(nodeToValue({ kind: "number", value: "42" })).toBe(42);
		expect(nodeToValue({ kind: "number", value: "x" })).toBe(0);
		expect(nodeToValue({ kind: "boolean", value: true })).toBe(true);
		expect(nodeToValue({ kind: "null" })).toBeNull();
	});

	it("emits datetime as ISO string or numeric Unix", () => {
		const epoch = Date.parse("2024-01-02T03:04:05.000Z");
		expect(nodeToValue({ kind: "datetime", epochMs: epoch, format: "iso" })).toBe("2024-01-02T03:04:05.000Z");
		expect(nodeToValue({ kind: "datetime", epochMs: epoch, format: "unix" })).toBe(Math.floor(epoch / 1000));
	});

	it("builds objects (skipping empty keys) and arrays", () => {
		const node: JsonNode = {
			kind: "object",
			entries: [
				{ id: "1", key: "a", node: { kind: "number", value: "1" } },
				{ id: "2", key: "", node: { kind: "string", value: "ignored" } },
				{ id: "3", key: "list", node: { kind: "array", items: [{ id: "4", node: { kind: "boolean", value: false } }] } },
			],
		};
		expect(nodeToValue(node)).toEqual({ a: 1, list: [false] });
	});
});

describe("valueToNode + round-trip", () => {
	it("maps each JS type to a node kind", () => {
		expect(valueToNode("s").kind).toBe("string");
		expect(valueToNode(1).kind).toBe("number");
		expect(valueToNode(true).kind).toBe("boolean");
		expect(valueToNode(null).kind).toBe("null");
		expect(valueToNode([]).kind).toBe("array");
		expect(valueToNode({}).kind).toBe("object");
	});

	it("round-trips an object through serialize", () => {
		const value = { name: "x", count: 3, nested: { ok: true }, items: [1, 2] };
		expect(JSON.parse(serializeNode(valueToNode(value)))).toEqual(value);
	});
});

describe("parseToNode", () => {
	it("parses valid JSON and treats blank as an empty object", () => {
		expect(parseToNode("")).toEqual({ kind: "object", entries: [] });
		expect(nodeToValue(parseToNode('{"a":1}') as JsonNode)).toEqual({ a: 1 });
	});

	it("returns null for invalid JSON", () => {
		expect(parseToNode("{bad")).toBeNull();
	});
});

describe("createNode", () => {
	it("creates each kind with sensible defaults", () => {
		expect(createNode("string")).toEqual({ kind: "string", value: "" });
		expect(createNode("object")).toEqual({ kind: "object", entries: [] });
		expect(createNode("datetime").kind).toBe("datetime");
	});
});
