import { describe, expect, test } from "bun:test";
import { createEmptyRequest, type RequestModel } from "@/lib/request/model";
import { runPreRequest, type RunScriptFn, runTests } from "@/lib/scripting/run";
import type { ScriptResponseView } from "@/lib/scripting/types";
import type { VarScope } from "@/lib/vars/interpolate";

function emptyScope(over: Partial<VarScope> = {}): VarScope {
	return { local: {}, data: {}, environment: {}, collection: {}, globals: {}, ...over };
}

function withScript(req: RequestModel, listen: "prerequest" | "test", script: string): RequestModel {
	return { ...req, events: [{ listen, script }] };
}

const response: ScriptResponseView = { code: 200, status: "OK", headers: [], body: '{"ok":true}', responseTime: 5 };

describe("runPreRequest", () => {
	test("returns the request untouched when there is no pre-request script", async () => {
		const req = createEmptyRequest();
		const out = await runPreRequest(req, emptyScope());
		expect(out.request).toBe(req);
		expect(out.logs).toEqual([]);
	});

	test("applies request and variable mutations from the script", async () => {
		const req = withScript({ ...createEmptyRequest(), url: "https://x.test", method: "GET" }, "prerequest", "noop");
		const fakeRun: RunScriptFn = async (_source, ctx) => {
			ctx.request.url = "https://x.test/mutated";
			ctx.request.headers.push({ key: "X-Token", value: "abc" });
			ctx.vars.environment.token = "abc";
			ctx.vars.local.derived = "1";
			return { results: [], logs: [{ level: "log", args: ["pre"] }] };
		};
		const out = await runPreRequest(req, emptyScope(), { runScript: fakeRun });
		expect(out.request.url).toBe("https://x.test/mutated");
		expect(out.request.headers.map(h => ({ key: h.key, value: h.value }))).toEqual([{ key: "X-Token", value: "abc" }]);
		expect(out.scope.environment.token).toBe("abc");
		expect(out.scope.local.derived).toBe("1");
		expect(out.logs).toEqual([{ level: "log", args: ["pre"] }]);
	});

	test("round-trips a raw body string mutation", async () => {
		const base: RequestModel = { ...createEmptyRequest(), body: { type: "raw", subtype: "json", content: "{}" } };
		const req = withScript(base, "prerequest", "x");
		const fakeRun: RunScriptFn = async (_s, ctx) => {
			ctx.request.body = '{"a":1}';
			return { results: [], logs: [] };
		};
		const out = await runPreRequest(req, emptyScope(), { runScript: fakeRun });
		expect(out.request.body).toEqual({ type: "raw", subtype: "json", content: '{"a":1}' });
	});

	test("exposes raw/graphql bodies as strings to the script", async () => {
		const gql: RequestModel = { ...createEmptyRequest(), body: { type: "graphql", query: "{ me }", variables: "{}" } };
		const req = withScript(gql, "prerequest", "x");
		let seen = "";
		const fakeRun: RunScriptFn = async (_s, ctx) => {
			seen = ctx.request.body;
			return { results: [], logs: [] };
		};
		await runPreRequest(req, emptyScope(), { runScript: fakeRun });
		expect(seen).toBe(JSON.stringify({ query: "{ me }", variables: "{}" }));
	});
});

describe("runTests", () => {
	test("returns empty results when there is no test script", async () => {
		const out = await runTests(createEmptyRequest(), response, emptyScope());
		expect(out.results).toEqual([]);
		expect(out.logs).toEqual([]);
	});

	test("collects results and variable writes from the script", async () => {
		const req = withScript(createEmptyRequest(), "test", "x");
		const fakeRun: RunScriptFn = async (_s, ctx) => {
			expect(ctx.response).toBe(response);
			ctx.vars.globals.lastStatus = String(ctx.response?.code);
			return { results: [{ name: "ok", passed: true }], logs: [{ level: "info", args: ["t"] }] };
		};
		const out = await runTests(req, response, emptyScope(), { runScript: fakeRun });
		expect(out.results).toEqual([{ name: "ok", passed: true }]);
		expect(out.scope.globals.lastStatus).toBe("200");
		expect(out.logs).toEqual([{ level: "info", args: ["t"] }]);
	});
});
