import { describe, expect, it } from "bun:test";
import { normalizeResponse, prettyPrintBody } from "@/lib/http/normalize";
import type { RawHttpResponse } from "@/lib/http/types";

function raw(partial: Partial<RawHttpResponse> = {}): RawHttpResponse {
	return {
		status: 200,
		statusText: "OK",
		headers: [],
		bodyBytes: new Uint8Array(),
		contentType: undefined,
		...partial,
	};
}

describe("normalizeResponse", () => {
	it("maps status, timing and headers", () => {
		const out = normalizeResponse(raw({ headers: [["X-A", "1"]] }), 42);
		expect(out.status).toBe(200);
		expect(out.timeMs).toBe(42);
		expect(out.headers).toEqual([{ key: "X-A", value: "1" }]);
	});

	it("decodes UTF-8 body and reports byte size", () => {
		const bytes = new TextEncoder().encode("héllo");
		const out = normalizeResponse(raw({ bodyBytes: bytes }), 1);
		expect(out.bodyText).toBe("héllo");
		expect(out.bodyBytes).toBe(bytes.byteLength);
		expect(out.bodyBytes).toBeGreaterThan(5);
	});

	it("parses Set-Cookie headers with attributes", () => {
		const out = normalizeResponse(
			raw({ headers: [["set-cookie", "sid=abc; Path=/; HttpOnly"]] }),
			1,
		);
		expect(out.cookies).toEqual([{ name: "sid", value: "abc", attributes: "Path=/; HttpOnly" }]);
	});

	it("parses a valueless cookie", () => {
		const out = normalizeResponse(raw({ headers: [["set-cookie", "flag"]] }), 1);
		expect(out.cookies[0]).toEqual({ name: "flag", value: "", attributes: "" });
	});

	it("propagates an error field", () => {
		expect(normalizeResponse(raw({ error: "boom" }), 0).error).toBe("boom");
	});
});

describe("prettyPrintBody", () => {
	it("formats JSON bodies", () => {
		expect(prettyPrintBody('{"a":1}', "application/json")).toBe('{\n  "a": 1\n}');
	});

	it("handles +json content types", () => {
		expect(prettyPrintBody('{"a":1}', "application/vnd.api+json")).toContain('"a": 1');
	});

	it("returns non-JSON unchanged", () => {
		expect(prettyPrintBody("plain", "text/plain")).toBe("plain");
	});

	it("returns invalid JSON unchanged", () => {
		expect(prettyPrintBody("{bad", "application/json")).toBe("{bad");
	});

	it("returns body unchanged when content-type is absent", () => {
		expect(prettyPrintBody('{"a":1}', undefined)).toBe('{"a":1}');
	});
});
