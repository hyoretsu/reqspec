import { describe, expect, test } from "bun:test";
import {
	canConnect,
	canSend,
	isValidWsUrl,
	makeLogEntry,
	normalizeWsUrl,
	statusLabel,
	validateOutgoing,
	type WsStatus,
} from "@/lib/protocols/websocket";

describe("normalizeWsUrl", () => {
	test("trims and passes through ws/wss URLs", () => {
		expect(normalizeWsUrl("  wss://x.test/ws ")).toBe("wss://x.test/ws");
		expect(normalizeWsUrl("WS://x.test")).toBe("WS://x.test");
	});

	test("upgrades http/https schemes", () => {
		expect(normalizeWsUrl("http://x.test")).toBe("ws://x.test");
		expect(normalizeWsUrl("HTTPS://x.test/a")).toBe("wss://x.test/a");
	});

	test("defaults a bare host to ws://", () => {
		expect(normalizeWsUrl("x.test:8080/ws")).toBe("ws://x.test:8080/ws");
	});

	test("returns empty for blank input", () => {
		expect(normalizeWsUrl("   ")).toBe("");
	});
});

describe("isValidWsUrl", () => {
	test("accepts valid ws/wss endpoints", () => {
		expect(isValidWsUrl("wss://x.test/ws")).toBe(true);
		expect(isValidWsUrl("x.test")).toBe(true);
	});

	test("rejects blank and unparseable input", () => {
		expect(isValidWsUrl("")).toBe(false);
		expect(isValidWsUrl("ws://")).toBe(false);
	});
});

describe("makeLogEntry", () => {
	test("builds an entry with id, direction, data and timestamp", () => {
		const entry = makeLogEntry("out", "hello", 1234);
		expect(entry).toMatchObject({ direction: "out", data: "hello", at: 1234 });
		expect(entry.id).toBeString();
	});

	test("defaults the timestamp to now", () => {
		const before = Date.now();
		const entry = makeLogEntry("in", "x");
		expect(entry.at).toBeGreaterThanOrEqual(before);
	});
});

describe("validateOutgoing", () => {
	test("passes text through unchanged", () => {
		expect(validateOutgoing("anything", "text")).toEqual({
			ok: true,
			value: "anything",
		});
	});

	test("canonicalizes valid JSON", () => {
		expect(validateOutgoing('{ "a": 1 }', "json")).toEqual({
			ok: true,
			value: '{"a":1}',
		});
	});

	test("reports an error for invalid JSON", () => {
		const result = validateOutgoing("{bad", "json");
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toBeString();
	});
});

describe("status predicates", () => {
	test("canSend only when open", () => {
		expect(canSend("open")).toBe(true);
		for (const s of ["idle", "connecting", "closed", "error"] as WsStatus[]) {
			expect(canSend(s)).toBe(false);
		}
	});

	test("canConnect unless connecting or open", () => {
		for (const s of ["idle", "closed", "error"] as WsStatus[]) {
			expect(canConnect(s)).toBe(true);
		}
		expect(canConnect("connecting")).toBe(false);
		expect(canConnect("open")).toBe(false);
	});

	test("statusLabel covers every status", () => {
		for (const s of [
			"idle",
			"connecting",
			"open",
			"closed",
			"error",
		] as WsStatus[]) {
			expect(statusLabel(s)).toBeString();
		}
	});
});
