import { describe, expect, it } from "bun:test";
import { createEmptyRequest, type KeyValue } from "@/lib/request/model";
import { interpolate, interpolateRequest, type VarScope } from "@/lib/vars/interpolate";

function makeScope(partial: Partial<VarScope>): VarScope {
	return { local: {}, data: {}, environment: {}, collection: {}, globals: {}, ...partial };
}

const scope = makeScope({
	environment: { host: "api.example.com", token: "env-token" },
	collection: { host: "collection-host", base: "/v1" },
	globals: { host: "global.example.com", version: "v1" },
});

function kv(key: string, value: string, enabled = true): KeyValue {
	return { id: crypto.randomUUID(), key, value, enabled };
}

describe("interpolate", () => {
	it("resolves a single variable", () => {
		expect(interpolate("https://{{host}}/users", scope)).toBe("https://api.example.com/users");
	});

	it("honors precedence environment > collection > global", () => {
		expect(interpolate("{{host}}", scope)).toBe("api.example.com");
		expect(interpolate("{{base}}", scope)).toBe("/v1");
		expect(interpolate("{{version}}", scope)).toBe("v1");
	});

	it("respects local > data > environment ordering", () => {
		const layered = makeScope({
			local: { x: "local" },
			data: { x: "data", y: "data-y" },
			environment: { x: "env", y: "env-y", z: "env-z" },
		});
		expect(interpolate("{{x}}", layered)).toBe("local");
		expect(interpolate("{{y}}", layered)).toBe("data-y");
		expect(interpolate("{{z}}", layered)).toBe("env-z");
	});

	it("leaves unknown variables literal", () => {
		expect(interpolate("{{missing}}", scope)).toBe("{{missing}}");
	});

	it("resolves a known dynamic variable", () => {
		const out = interpolate("{{$timestamp}}", scope);
		expect(out).toMatch(/^\d+$/);
	});

	it("lets a user variable override a dynamic name", () => {
		const overridden = makeScope({ environment: { $timestamp: "fixed" } });
		expect(interpolate("{{$timestamp}}", overridden)).toBe("fixed");
	});

	it("leaves an unknown dynamic variable literal", () => {
		expect(interpolate("{{$nope}}", scope)).toBe("{{$nope}}");
	});

	it("resolves adjacent variables and trims whitespace", () => {
		expect(interpolate("{{ host }}{{version}}", scope)).toBe("api.example.comv1");
	});

	it("does not re-expand resolved values (single pass)", () => {
		const nested = makeScope({ environment: { a: "{{b}}", b: "deep" } });
		expect(interpolate("{{a}}", nested)).toBe("{{b}}");
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

	it("interpolates a binary body's content-type", () => {
		const req = createEmptyRequest();
		req.body = { type: "binary", fileId: "f", fileName: "a.bin", contentType: "application/{{version}}" };
		const out = interpolateRequest(req, scope);
		expect(out.body).toEqual({ type: "binary", fileId: "f", fileName: "a.bin", contentType: "application/v1" });
	});
});
