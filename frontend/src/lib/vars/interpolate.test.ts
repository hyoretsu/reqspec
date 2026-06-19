import { describe, expect, it } from "bun:test";
import { createEmptyRequest, type KeyValue } from "@/lib/request/model";
import { interpolate, interpolateRequest, type VarScope } from "@/lib/vars/interpolate";

const scope: VarScope = {
	env: { host: "api.example.com", token: "env-token" },
	globals: { host: "global.example.com", version: "v1" },
};

function kv(key: string, value: string, enabled = true): KeyValue {
	return { id: crypto.randomUUID(), key, value, enabled };
}

describe("interpolate", () => {
	it("resolves a single variable", () => {
		expect(interpolate("https://{{host}}/users", scope)).toBe("https://api.example.com/users");
	});

	it("prefers env over globals", () => {
		expect(interpolate("{{host}}", scope)).toBe("api.example.com");
	});

	it("falls back to globals when env lacks the key", () => {
		expect(interpolate("{{version}}", scope)).toBe("v1");
	});

	it("leaves unknown variables literal", () => {
		expect(interpolate("{{missing}}", scope)).toBe("{{missing}}");
	});

	it("resolves adjacent variables", () => {
		expect(interpolate("{{host}}{{version}}", scope)).toBe("api.example.comv1");
	});

	it("tolerates internal whitespace in the token", () => {
		expect(interpolate("{{ host }}", scope)).toBe("api.example.com");
	});

	it("does not re-expand resolved values (single pass)", () => {
		const nested: VarScope = { env: { a: "{{b}}", b: "deep" }, globals: {} };
		expect(interpolate("{{a}}", nested)).toBe("{{b}}");
	});

	it("returns plain strings unchanged", () => {
		expect(interpolate("no vars here", scope)).toBe("no vars here");
	});
});

describe("interpolateRequest", () => {
	it("applies interpolation across every field", () => {
		const req = createEmptyRequest();
		req.url = "https://{{host}}/{{version}}";
		req.params = [kv("q", "{{token}}")];
		req.headers = [kv("X-Token", "{{token}}")];
		req.body = { type: "raw", subtype: "json", content: '{"v":"{{version}}"}' };
		req.auth = { type: "basic", username: "{{host}}", password: "{{token}}" };

		const out = interpolateRequest(req, scope);
		expect(out.url).toBe("https://api.example.com/v1");
		expect(out.params[0].value).toBe("env-token");
		expect(out.headers[0].value).toBe("env-token");
		expect(out.body).toEqual({ type: "raw", subtype: "json", content: '{"v":"v1"}' });
		expect(out.auth).toEqual({ type: "basic", username: "api.example.com", password: "env-token" });
	});

	it("interpolates bearer tokens", () => {
		const req = createEmptyRequest();
		req.auth = { type: "bearer", token: "{{token}}" };
		expect(interpolateRequest(req, scope).auth).toEqual({ type: "bearer", token: "env-token" });
	});

	it("interpolates field-based bodies and leaves none/auth untouched", () => {
		const req = createEmptyRequest();
		req.body = { type: "urlencoded", fields: [kv("k", "{{version}}")] };
		const out = interpolateRequest(req, scope);
		expect(out.body).toEqual({ type: "urlencoded", fields: [{ ...req.body.fields[0], value: "v1" }] });
		expect(out.auth).toEqual({ type: "none" });
	});
});
