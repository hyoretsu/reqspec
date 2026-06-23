import { describe, expect, test } from "bun:test";
import { runScript, ScriptError } from "@/lib/scripting/sandbox";
import type { PmContext } from "@/lib/scripting/types";

function makeContext(overrides: Partial<PmContext> = {}): PmContext {
	return {
		request: { method: "GET", url: "https://api.test/users", headers: [{ key: "Accept", value: "application/json" }], body: "" },
		vars: { environment: {}, globals: {}, collection: {}, local: {}, data: {} },
		requestName: "Get Users",
		eventName: "prerequest",
		...overrides,
	};
}

describe("runScript", () => {
	test("reads and writes variables through pm scopes", async () => {
		const ctx = makeContext({ vars: { environment: { token: "abc" }, globals: {}, collection: {}, local: {}, data: {} } });
		await runScript(
			`
			pm.environment.set("seen", pm.environment.get("token"));
			pm.variables.set("derived", "x" + pm.variables.get("token"));
			`,
			ctx,
		);
		expect(ctx.vars.environment.seen).toBe("abc");
		expect(ctx.vars.local.derived).toBe("xabc");
	});

	test("mutates the request (url, body, headers)", async () => {
		const ctx = makeContext();
		await runScript(
			`
			pm.request.url = pm.request.url + "?page=1";
			pm.request.body = JSON.stringify({ ok: true });
			pm.request.headers.upsert({ key: "Accept", value: "text/plain" });
			pm.request.headers.add({ key: "X-Trace", value: "1" });
			`,
			ctx,
		);
		expect(ctx.request.url).toBe("https://api.test/users?page=1");
		expect(ctx.request.body).toBe('{"ok":true}');
		expect(ctx.request.headers).toEqual([
			{ key: "Accept", value: "text/plain" },
			{ key: "X-Trace", value: "1" },
		]);
	});

	test("collects passing and failing test results", async () => {
		const ctx = makeContext({
			eventName: "test",
			response: { code: 200, status: "OK", headers: [{ key: "Content-Type", value: "application/json" }], body: '{"id":7}', responseTime: 12 },
		});
		const out = await runScript(
			`
			pm.test("status is 200", () => pm.response.to.have.status(200));
			pm.test("has id", () => pm.expect(pm.response.json().id).to.equal(7));
			pm.test("fails", () => pm.expect(1).to.equal(2));
			`,
			ctx,
		);
		expect(out.results).toEqual([
			{ name: "status is 200", passed: true, error: undefined },
			{ name: "has id", passed: true, error: undefined },
			{ name: "fails", passed: false, error: "expected 1 to equal 2" },
		]);
	});

	test("captures console output", async () => {
		const ctx = makeContext();
		const out = await runScript(`console.log("hello", 42); console.error("boom");`, ctx);
		expect(out.logs).toEqual([
			{ level: "log", args: ["hello", 42] },
			{ level: "error", args: ["boom"] },
		]);
	});

	test("bridges pm.sendRequest to the host", async () => {
		const ctx = makeContext({
			sendRequest: async input => ({ code: 201, status: "Created", headers: [], body: JSON.stringify({ echoed: input.url }) }),
		});
		await runScript(
			`
			const res = await pm.sendRequest("https://api.test/ping");
			pm.environment.set("echoed", res.json().echoed);
			pm.environment.set("code", String(res.code));
			`,
			ctx,
		);
		expect(ctx.vars.environment.echoed).toBe("https://api.test/ping");
		expect(ctx.vars.environment.code).toBe("201");
	});

	test("surfaces a rejected pm.sendRequest as a script error", async () => {
		const ctx = makeContext({
			sendRequest: async () => {
				throw new Error("network down");
			},
		});
		expect(runScript(`await pm.sendRequest("https://api.test/ping");`, ctx)).rejects.toThrow("network down");
	});

	test("throws ScriptError on an uncaught throw", async () => {
		const ctx = makeContext();
		expect(runScript(`throw new Error("boom");`, ctx)).rejects.toBeInstanceOf(ScriptError);
	});

	test("does not expose host globals", async () => {
		const ctx = makeContext();
		const out = await runScript(`console.log(typeof fetch, typeof window, typeof process);`, ctx);
		expect(out.logs[0].args).toEqual(["undefined", "undefined", "undefined"]);
	});
});
