import { describe, expect, it } from "bun:test";
import {
	detectPostmanKind,
	parsePostman,
	parsePostmanCollection,
	parsePostmanEnvironment,
} from "@/lib/import/postman";

describe("detectPostmanKind", () => {
	it("detects an environment by scope marker", () => {
		expect(detectPostmanKind({ _postman_variable_scope: "environment", values: [] })).toBe("environment");
	});

	it("detects an environment by values array without items", () => {
		expect(detectPostmanKind({ name: "x", values: [] })).toBe("environment");
	});

	it("detects a collection by item array", () => {
		expect(detectPostmanKind({ item: [] })).toBe("collection");
	});

	it("detects a collection by info object", () => {
		expect(detectPostmanKind({ info: { name: "x" } })).toBe("collection");
	});

	it("returns null for unrelated or non-object input", () => {
		expect(detectPostmanKind({ foo: 1 })).toBeNull();
		expect(detectPostmanKind(null)).toBeNull();
		expect(detectPostmanKind("nope")).toBeNull();
	});
});

describe("parsePostmanCollection", () => {
	it("uses a fallback name and empty results for an empty collection", () => {
		const out = parsePostmanCollection({});
		expect(out.name).toBe("Imported collection");
		expect(out.requests).toEqual([]);
		expect(out.variables).toEqual([]);
	});

	it("walks nested folders into folderPath", () => {
		const json = {
			info: { name: "API" },
			item: [
				{
					name: "Users",
					item: [
						{ name: "List", request: { method: "GET", url: "https://x.com/users" } },
						{
							name: "Admin",
							item: [{ name: "Ban", request: { method: "POST", url: "https://x.com/ban" } }],
						},
					],
				},
				{ name: "Ping", request: { method: "GET", url: "https://x.com/ping" } },
			],
		};
		const out = parsePostmanCollection(json);
		expect(out.name).toBe("API");
		expect(out.requests.map(r => [r.folderPath, r.name])).toEqual([
			[["Users"], "List"],
			[["Users", "Admin"], "Ban"],
			[[], "Ping"],
		]);
	});

	it("parses a string url, splitting the query into params", () => {
		const out = parsePostmanCollection({
			item: [{ name: "q", request: { method: "GET", url: "https://x.com/a?b=1&c=hello%20world" } }],
		});
		const req = out.requests[0].request;
		expect(req.url).toBe("https://x.com/a");
		expect(req.params.map(p => [p.key, p.value])).toEqual([
			["b", "1"],
			["c", "hello world"],
		]);
	});

	it("prefers the structured query array on an object url", () => {
		const out = parsePostmanCollection({
			item: [
				{
					name: "q",
					request: {
						method: "GET",
						url: { raw: "https://x.com/a?ignored=1", query: [{ key: "id", value: "7", disabled: true }] },
					},
				},
			],
		});
		const req = out.requests[0].request;
		expect(req.url).toBe("https://x.com/a");
		expect(req.params).toEqual([expect.objectContaining({ key: "id", value: "7", enabled: false })]);
	});

	it("handles an object url with a fragment and no query", () => {
		const out = parsePostmanCollection({
			item: [{ name: "q", request: { method: "GET", url: { raw: "https://x.com/a#frag" } } }],
		});
		expect(out.requests[0].request.url).toBe("https://x.com/a#frag");
		expect(out.requests[0].request.params).toEqual([]);
	});

	it("maps headers with disabled flags", () => {
		const out = parsePostmanCollection({
			item: [
				{
					name: "h",
					request: {
						method: "GET",
						url: "https://x.com",
						header: [
							{ key: "A", value: "1" },
							{ key: "B", value: "2", disabled: true },
						],
					},
				},
			],
		});
		expect(out.requests[0].request.headers.map(h => [h.key, h.enabled])).toEqual([
			["A", true],
			["B", false],
		]);
	});

	it("defaults an unknown method to GET and a missing name", () => {
		const out = parsePostmanCollection({ item: [{ request: { method: "FETCH", url: "https://x.com" } }] });
		expect(out.requests[0].request.method).toBe("GET");
		expect(out.requests[0].name).toBe("Untitled request");
	});

	it("parses raw JSON and raw text bodies", () => {
		const json = {
			item: [
				{
					name: "j",
					request: {
						method: "POST",
						url: "https://x.com",
						body: { mode: "raw", raw: "{}", options: { raw: { language: "json" } } },
					},
				},
				{
					name: "t",
					request: { method: "POST", url: "https://x.com", body: { mode: "raw", raw: "hi" } },
				},
			],
		};
		const out = parsePostmanCollection(json);
		expect(out.requests[0].request.body).toEqual({ type: "raw", subtype: "json", content: "{}" });
		expect(out.requests[1].request.body).toEqual({ type: "raw", subtype: "text", content: "hi" });
	});

	it("parses urlencoded and formdata bodies, and treats unknown/empty modes as none", () => {
		const json = {
			item: [
				{
					name: "u",
					request: {
						method: "POST",
						url: "https://x.com",
						body: { mode: "urlencoded", urlencoded: [{ key: "a", value: "1" }] },
					},
				},
				{
					name: "f",
					request: {
						method: "POST",
						url: "https://x.com",
						body: { mode: "formdata", formdata: [{ key: "file", value: "", type: "file" }] },
					},
				},
				{ name: "g", request: { method: "POST", url: "https://x.com", body: { mode: "graphql" } } },
				{ name: "n", request: { method: "GET", url: "https://x.com" } },
			],
		};
		const out = parsePostmanCollection(json);
		expect(out.requests[0].request.body).toMatchObject({ type: "urlencoded" });
		expect(out.requests[1].request.body).toMatchObject({ type: "form-data" });
		expect(out.requests[2].request.body).toEqual({ type: "none" });
		expect(out.requests[3].request.body).toEqual({ type: "none" });
	});

	it("parses basic, bearer and absent/other auth", () => {
		const json = {
			item: [
				{
					name: "b",
					request: {
						method: "GET",
						url: "https://x.com",
						auth: {
							type: "basic",
							basic: [
								{ key: "username", value: "u" },
								{ key: "password", value: "p" },
							],
						},
					},
				},
				{
					name: "t",
					request: {
						method: "GET",
						url: "https://x.com",
						auth: { type: "bearer", bearer: [{ key: "token", value: "tok" }] },
					},
				},
				{
					name: "o",
					request: { method: "GET", url: "https://x.com", auth: { type: "apikey" } },
				},
			],
		};
		const out = parsePostmanCollection(json);
		expect(out.requests[0].request.auth).toEqual({ type: "basic", username: "u", password: "p" });
		expect(out.requests[1].request.auth).toEqual({ type: "bearer", token: "tok" });
		expect(out.requests[2].request.auth).toEqual({ type: "none" });
	});

	it("maps collection-level variables", () => {
		const out = parsePostmanCollection({
			info: { name: "API" },
			variable: [{ key: "baseUrl", value: "https://x.com", enabled: true }],
		});
		expect(out.variables.map(v => [v.key, v.value])).toEqual([["baseUrl", "https://x.com"]]);
	});
});

describe("parsePostmanEnvironment", () => {
	it("maps values to variables with enabled flags", () => {
		const out = parsePostmanEnvironment({
			name: "Prod",
			values: [
				{ key: "host", value: "x", enabled: true },
				{ key: "secret", value: "y", enabled: false },
			],
		});
		expect(out.name).toBe("Prod");
		expect(out.variables.map(v => [v.key, v.value, v.enabled])).toEqual([
			["host", "x", true],
			["secret", "y", false],
		]);
	});

	it("falls back to a default name", () => {
		expect(parsePostmanEnvironment({}).name).toBe("Imported environment");
	});
});

describe("parsePostman", () => {
	it("dispatches to the collection parser", () => {
		const out = parsePostman({ info: { name: "C" }, item: [] });
		expect(out.kind).toBe("collection");
	});

	it("dispatches to the environment parser", () => {
		const out = parsePostman({ _postman_variable_scope: "environment", name: "E", values: [] });
		expect(out.kind).toBe("environment");
	});

	it("throws on an unrecognized shape", () => {
		expect(() => parsePostman({ random: true })).toThrow(/Unrecognized/);
	});
});
