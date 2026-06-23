import { describe, expect as bunExpect, it } from "bun:test";
import { createPm } from "@/lib/scripting/pm";
import type { PmContext } from "@/lib/scripting/types";

function makeCtx(overrides: Partial<PmContext> = {}): PmContext {
	return {
		request: { method: "GET", url: "https://x.com", headers: [{ key: "Accept", value: "*/*" }], body: "" },
		response: {
			code: 200,
			status: "OK",
			headers: [{ key: "Content-Type", value: "application/json" }],
			body: '{"ok":true}',
			responseTime: 12,
		},
		vars: { environment: {}, globals: {}, collection: {}, local: {}, data: {} },
		requestName: "Req",
		eventName: "test",
		...overrides,
	};
}

describe("createPm — variable scopes", () => {
	it("get/set/unset/has/clear/toObject on a scope", () => {
		const ctx = makeCtx();
		const { pm } = createPm(ctx);
		const env = pm.environment as ReturnType<typeof Object> & Record<string, (...a: unknown[]) => unknown>;
		bunExpect((env.get as (k: string) => unknown)("k")).toBeUndefined();
		bunExpect((env.has as (k: string) => unknown)("k")).toBe(false);
		(env.set as (k: string, v: unknown) => void)("k", 5);
		bunExpect(ctx.vars.environment.k).toBe("5");
		bunExpect((env.has as (k: string) => unknown)("k")).toBe(true);
		bunExpect((env.toObject as () => unknown)()).toEqual({ k: "5" });
		(env.unset as (k: string) => void)("k");
		bunExpect((env.has as (k: string) => unknown)("k")).toBe(false);
		(env.set as (k: string, v: unknown) => void)("a", "1");
		(env.clear as () => void)();
		bunExpect(ctx.vars.environment).toEqual({});
	});

	it("pm.variables reads with precedence and writes to local", () => {
		const ctx = makeCtx();
		ctx.vars.globals.x = "g";
		ctx.vars.collection.x = "c";
		ctx.vars.environment.x = "e";
		ctx.vars.data.x = "d";
		ctx.vars.local.x = "l";
		const { pm } = createPm(ctx);
		const vars = pm.variables as Record<string, (...a: unknown[]) => unknown>;
		bunExpect((vars.get as (k: string) => unknown)("x")).toBe("l");
		delete ctx.vars.local.x;
		bunExpect((vars.get as (k: string) => unknown)("x")).toBe("d");
		bunExpect((vars.get as (k: string) => unknown)("missing")).toBeUndefined();
		bunExpect((vars.has as (k: string) => unknown)("x")).toBe(true);
		bunExpect((vars.has as (k: string) => unknown)("missing")).toBe(false);
		(vars.set as (k: string, v: unknown) => void)("y", 9);
		bunExpect(ctx.vars.local.y).toBe("9");
	});
});

describe("createPm — request", () => {
	it("exposes method/url/body and a header list with mutation", () => {
		const ctx = makeCtx();
		const { pm } = createPm(ctx);
		const req = pm.request as Record<string, unknown>;
		bunExpect(req.method).toBe("GET");
		bunExpect(req.url).toBe("https://x.com");
		(req as { url: string }).url = "https://y.com";
		bunExpect(ctx.request.url).toBe("https://y.com");
		(req as { body: string }).body = "payload";
		bunExpect(ctx.request.body).toBe("payload");
		bunExpect(req.body).toBe("payload");

		const headers = req.headers as Record<string, (...a: unknown[]) => unknown>;
		bunExpect((headers.get as (n: string) => unknown)("accept")).toBe("*/*");
		bunExpect((headers.has as (n: string) => unknown)("accept")).toBe(true);
		(headers.add as (h: unknown) => void)({ key: "X-A", value: "1" });
		(headers.upsert as (h: unknown) => void)({ key: "Accept", value: "json" });
		(headers.upsert as (h: unknown) => void)({ key: "X-New", value: "2" });
		bunExpect((headers.get as (n: string) => unknown)("Accept")).toBe("json");
		bunExpect((headers.get as (n: string) => unknown)("X-New")).toBe("2");
		(headers.remove as (n: string) => void)("x-a");
		(headers.remove as (n: string) => void)("nope");
		bunExpect((headers.has as (n: string) => unknown)("X-A")).toBe(false);
	});
});

describe("createPm — response", () => {
	it("is undefined when there is no response", () => {
		const { pm } = createPm(makeCtx({ response: undefined }));
		bunExpect(pm.response).toBeUndefined();
	});

	it("exposes code/status/text/json/headers and assertions", () => {
		const ctx = makeCtx();
		const { pm } = createPm(ctx);
		const res = pm.response as Record<string, unknown>;
		bunExpect(res.code).toBe(200);
		bunExpect(res.status).toBe("OK");
		bunExpect(res.responseTime).toBe(12);
		bunExpect((res.text as () => unknown)()).toBe('{"ok":true}');
		bunExpect((res.json as () => unknown)()).toEqual({ ok: true });
		const to = res.to as { have: Record<string, (...a: unknown[]) => void>; be: { json: void } };
		to.have.status(200);
		to.have.status("OK");
		to.have.header("content-type");
		bunExpect(() => to.have.status(404)).toThrow();
		bunExpect(() => to.have.status("Created")).toThrow();
		bunExpect(() => to.have.header("missing")).toThrow();
		bunExpect(to.be.json).toBeUndefined();
	});
});

describe("createPm — test()", () => {
	it("records pass and failure", () => {
		const ctx = makeCtx();
		const { pm, results } = createPm(ctx);
		const test = pm.test as (n: string, f: () => void) => void;
		const expectFn = pm.expect as (v: unknown) => { to: { equal: (e: unknown) => void } };
		test("passes", () => expectFn(1).to.equal(1));
		test("fails", () => expectFn(1).to.equal(2));
		test("throws non-error", () => {
			throw "boom";
		});
		bunExpect(results).toEqual([
			{ name: "passes", passed: true },
			{ name: "fails", passed: false, error: "expected 1 to equal 2" },
			{ name: "throws non-error", passed: false, error: "boom" },
		]);
	});
});

describe("createPm — sendRequest", () => {
	const sample = { code: 201, status: "Created", headers: [{ key: "h", value: "v" }], body: '{"id":1}' };

	it("sends via string url and resolves a wrapped response", async () => {
		const ctx = makeCtx({ sendRequest: async () => sample });
		const { pm } = createPm(ctx);
		const send = pm.sendRequest as (i: unknown, cb?: unknown) => Promise<Record<string, unknown>>;
		const res = await send("https://api.test");
		bunExpect(res.code).toBe(201);
		bunExpect((res.json as () => unknown)()).toEqual({ id: 1 });
		bunExpect((res.text as () => unknown)()).toBe('{"id":1}');
	});

	it("supports the (err, res) callback form", async () => {
		const ctx = makeCtx({ sendRequest: async () => sample });
		const { pm } = createPm(ctx);
		const send = pm.sendRequest as (i: unknown, cb: (e: unknown, r: unknown) => void) => Promise<unknown>;
		let received: unknown;
		await send({ url: "https://api.test", method: "POST" }, (err, r) => {
			received = { err, r };
		});
		bunExpect((received as { err: unknown }).err).toBeNull();
	});

	it("rejects (promise) and reports via callback on failure", async () => {
		const ctx = makeCtx({
			sendRequest: async () => {
				throw new Error("down");
			},
		});
		const { pm } = createPm(ctx);
		const send = pm.sendRequest as (i: unknown, cb?: (e: unknown, r: unknown) => void) => Promise<unknown>;
		await bunExpect(send("https://api.test")).rejects.toThrow("down");

		let cbErr: unknown;
		const out = await send("https://api.test", e => {
			cbErr = e;
		});
		bunExpect(out).toBeNull();
		bunExpect((cbErr as Error).message).toBe("down");
	});

	it("wraps a thrown non-Error into an Error", async () => {
		const ctx = makeCtx({
			sendRequest: async () => {
				throw "raw";
			},
		});
		const { pm } = createPm(ctx);
		const send = pm.sendRequest as (i: unknown) => Promise<unknown>;
		await bunExpect(send("https://api.test")).rejects.toThrow("raw");
	});

	it("throws when no sendRequest is provided", async () => {
		const { pm } = createPm(makeCtx({ sendRequest: undefined }));
		const send = pm.sendRequest as (i: unknown) => Promise<unknown>;
		await bunExpect(send("https://api.test")).rejects.toThrow("not available");
	});
});

describe("createPm — info", () => {
	it("exposes request and event names", () => {
		const { pm } = createPm(makeCtx({ requestName: "Login", eventName: "prerequest" }));
		bunExpect(pm.info).toEqual({ requestName: "Login", eventName: "prerequest" });
	});
});
