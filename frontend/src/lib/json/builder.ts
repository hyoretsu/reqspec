import { type DateFormatId, formatDateTime, isNumericFormat } from "@/lib/format/datetime";

export type JsonNode =
	| { kind: "string"; value: string }
	| { kind: "number"; value: string }
	| { kind: "boolean"; value: boolean }
	| { kind: "null" }
	| { kind: "datetime"; epochMs: number; format: DateFormatId }
	| { kind: "object"; entries: { id: string; key: string; node: JsonNode }[] }
	| { kind: "array"; items: { id: string; node: JsonNode }[] };

export type JsonNodeKind = JsonNode["kind"];

export function createNode(kind: JsonNodeKind): JsonNode {
	switch (kind) {
		case "string":
			return { kind: "string", value: "" };
		case "number":
			return { kind: "number", value: "0" };
		case "boolean":
			return { kind: "boolean", value: false };
		case "null":
			return { kind: "null" };
		case "datetime":
			return { kind: "datetime", epochMs: Date.now(), format: "iso" };
		case "object":
			return { kind: "object", entries: [] };
		case "array":
			return { kind: "array", items: [] };
	}
}

/** Convert a builder node into a plain JS value (ready for JSON.stringify). Pure. */
export function nodeToValue(node: JsonNode): unknown {
	switch (node.kind) {
		case "string":
			return node.value;
		case "number": {
			const n = Number(node.value);
			return Number.isNaN(n) ? 0 : n;
		}
		case "boolean":
			return node.value;
		case "null":
			return null;
		case "datetime": {
			const formatted = formatDateTime(node.epochMs, node.format);
			return isNumericFormat(node.format) ? Number(formatted) : formatted;
		}
		case "object": {
			const out: Record<string, unknown> = {};
			for (const entry of node.entries) {
				if (entry.key !== "") out[entry.key] = nodeToValue(entry.node);
			}
			return out;
		}
		case "array":
			return node.items.map(item => nodeToValue(item.node));
	}
}

let idCounter = 0;
function nextId(): string {
	idCounter += 1;
	return `j${idCounter}`;
}

/** Best-effort conversion of a parsed JS value into a builder node. Pure. */
export function valueToNode(value: unknown): JsonNode {
	if (value === null) return { kind: "null" };
	if (typeof value === "string") return { kind: "string", value };
	if (typeof value === "number") return { kind: "number", value: String(value) };
	if (typeof value === "boolean") return { kind: "boolean", value };
	if (Array.isArray(value)) {
		return { kind: "array", items: value.map(v => ({ id: nextId(), node: valueToNode(v) })) };
	}
	if (typeof value === "object") {
		return {
			kind: "object",
			entries: Object.entries(value as Record<string, unknown>).map(([key, v]) => ({
				id: nextId(),
				key,
				node: valueToNode(v),
			})),
		};
	}
	return { kind: "string", value: String(value) };
}

export function serializeNode(node: JsonNode): string {
	return JSON.stringify(nodeToValue(node), null, 2);
}

/** Parse JSON text into a builder node; returns null if the text isn't valid JSON. */
export function parseToNode(text: string): JsonNode | null {
	if (text.trim() === "") return { kind: "object", entries: [] };
	try {
		return valueToNode(JSON.parse(text));
	} catch {
		return null;
	}
}
