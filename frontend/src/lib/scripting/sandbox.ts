import { createPm } from "@/lib/scripting/pm";
import type { ConsoleLog, PmContext, ScriptRunOutput, TestResult } from "@/lib/scripting/types";

/**
 * Runs untrusted pre-request / test scripts inside a QuickJS WASM sandbox.
 *
 * The heavy `quickjs-emscripten` module is loaded lazily on first use so requests
 * without scripts pay no startup cost. The `pm` API surface and assertion library run
 * *inside* the VM as a thin shim that forwards every stateful operation back to the host
 * via three bridge functions (`__call`, `__send`, `__log`); the host side reuses the
 * tested {@link createPm} engine so script semantics stay single-sourced. The VM has no
 * access to host globals (no `fetch`, `fs`, DOM, …) and is bounded by an interrupt
 * deadline so a runaway loop cannot hang the app.
 */

/** Max wall-clock a single script may run before the interrupt handler aborts it. */
const SCRIPT_TIMEOUT_MS = 5000;

let modulePromise: Promise<typeof import("quickjs-emscripten")> | null = null;
function loadQuickjs(): Promise<typeof import("quickjs-emscripten")> {
	modulePromise ??= import("quickjs-emscripten");
	return modulePromise;
}

/** Thrown when a script fails to compile or throws outside a `pm.test`. */
export class ScriptError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ScriptError";
	}
}

// Minimal structural views of the createPm sub-APIs the bridge calls (glue-side casts).
interface VarScopeApi {
	get(key: string): string | undefined;
	set(key: string, value: unknown): void;
	unset(key: string): void;
	has(key: string): boolean;
	clear(): void;
	toObject(): Record<string, string>;
}
interface VariablesApi {
	get(key: string): string | undefined;
	has(key: string): boolean;
	set(key: string, value: unknown): void;
}
interface HeaderListApi {
	get(name: string): string | undefined;
	has(name: string): boolean;
	add(header: { key: string; value: string }): void;
	upsert(header: { key: string; value: string }): void;
	remove(name: string): void;
}
interface RequestApi {
	method: string;
	url: string;
	body: string;
	headers: HeaderListApi;
}
interface ResponseApi {
	code: number;
	status: string;
	responseTime: number;
	text(): string;
}

interface CallPayload {
	ns: string;
	op: string;
	args: unknown[];
}

/** The in-VM `pm` shim + assertion library. Forwards all state to the host bridge. */
function bootstrap(ctx: PmContext): string {
	return `
const __c = (ns, op, ...args) => JSON.parse(__call(JSON.stringify({ ns, op, args }))).v;
function __makeScope(ns) {
	return {
		get: (k) => __c(ns, "get", k),
		set: (k, v) => __c(ns, "set", k, v),
		unset: (k) => __c(ns, "unset", k),
		has: (k) => __c(ns, "has", k),
		clear: () => __c(ns, "clear"),
		toObject: () => __c(ns, "toObject"),
	};
}
class AssertionError extends Error { constructor(m) { super(m); this.name = "AssertionError"; } }
function __typeOf(v) { if (v === null) return "null"; if (Array.isArray(v)) return "array"; return typeof v; }
function __str(v) {
	if (typeof v === "string") return JSON.stringify(v);
	if (v === undefined) return "undefined";
	try { return JSON.stringify(v) ?? String(v); } catch { return String(v); }
}
function __deepEqual(a, b) {
	if (Object.is(a, b)) return true;
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const ka = Object.keys(a), kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	return ka.every((k) => k in b && __deepEqual(a[k], b[k]));
}
function __len(v) { return (typeof v === "string" || Array.isArray(v)) ? v.length : undefined; }
class Assertion {
	constructor(obj) { this.obj = obj; this.negated = false; }
	get to() { return this; } get be() { return this; } get been() { return this; } get is() { return this; }
	get that() { return this; } get which() { return this; } get and() { return this; } get has() { return this; }
	get have() { return this; } get with() { return this; } get of() { return this; } get deep() { return this; }
	get not() { this.negated = !this.negated; return this; }
	__check(pass, m, nm) { if (this.negated ? pass : !pass) throw new AssertionError(this.negated ? nm : m); return this; }
	equal(e) { return this.__check(Object.is(this.obj, e), "expected " + __str(this.obj) + " to equal " + __str(e), "expected " + __str(this.obj) + " to not equal " + __str(e)); }
	eql(e) { return this.__check(__deepEqual(this.obj, e), "expected " + __str(this.obj) + " to deeply equal " + __str(e), "expected " + __str(this.obj) + " to not deeply equal " + __str(e)); }
	a(t) { return this.__check(__typeOf(this.obj) === t, "expected " + __str(this.obj) + " to be a " + t, "expected " + __str(this.obj) + " to not be a " + t); }
	an(t) { return this.a(t); }
	get true() { return this.__check(this.obj === true, "expected " + __str(this.obj) + " to be true", "expected " + __str(this.obj) + " to not be true"); }
	get false() { return this.__check(this.obj === false, "expected " + __str(this.obj) + " to be false", "expected " + __str(this.obj) + " to not be false"); }
	get null() { return this.__check(this.obj === null, "expected " + __str(this.obj) + " to be null", "expected " + __str(this.obj) + " to not be null"); }
	get undefined() { return this.__check(this.obj === undefined, "expected " + __str(this.obj) + " to be undefined", "expected " + __str(this.obj) + " to not be undefined"); }
	get ok() { return this.__check(Boolean(this.obj), "expected " + __str(this.obj) + " to be truthy", "expected " + __str(this.obj) + " to be falsy"); }
	get empty() { const l = (typeof this.obj === "object" && this.obj !== null && !Array.isArray(this.obj)) ? Object.keys(this.obj).length : (__len(this.obj) ?? 0); return this.__check(l === 0, "expected " + __str(this.obj) + " to be empty", "expected " + __str(this.obj) + " to not be empty"); }
	above(n) { return this.__check(Number(this.obj) > n, "expected " + __str(this.obj) + " to be above " + n, "expected " + __str(this.obj) + " to not be above " + n); }
	below(n) { return this.__check(Number(this.obj) < n, "expected " + __str(this.obj) + " to be below " + n, "expected " + __str(this.obj) + " to not be below " + n); }
	least(n) { return this.__check(Number(this.obj) >= n, "expected " + __str(this.obj) + " to be at least " + n, "expected " + __str(this.obj) + " to be below " + n); }
	most(n) { return this.__check(Number(this.obj) <= n, "expected " + __str(this.obj) + " to be at most " + n, "expected " + __str(this.obj) + " to be above " + n); }
	within(lo, hi) { const n = Number(this.obj); return this.__check(n >= lo && n <= hi, "expected " + __str(this.obj) + " to be within " + lo + ".." + hi, "expected " + __str(this.obj) + " to not be within " + lo + ".." + hi); }
	match(re) { return this.__check(re.test(String(this.obj)), "expected " + __str(this.obj) + " to match " + re, "expected " + __str(this.obj) + " to not match " + re); }
	include(n) { let pass = false; if (typeof this.obj === "string") pass = this.obj.includes(String(n)); else if (Array.isArray(this.obj)) pass = this.obj.some((i) => __deepEqual(i, n)); else if (typeof this.obj === "object" && this.obj !== null && typeof n === "object" && n !== null) pass = Object.entries(n).every(([k, v]) => __deepEqual(this.obj[k], v)); return this.__check(pass, "expected " + __str(this.obj) + " to include " + __str(n), "expected " + __str(this.obj) + " to not include " + __str(n)); }
	contain(n) { return this.include(n); }
	property(name, value) { const has = typeof this.obj === "object" && this.obj !== null && name in this.obj; if (arguments.length < 2) return this.__check(has, "expected " + __str(this.obj) + " to have property " + __str(name), "expected " + __str(this.obj) + " to not have property " + __str(name)); const actual = has ? this.obj[name] : undefined; return this.__check(has && __deepEqual(actual, value), "expected property " + __str(name) + " to equal " + __str(value) + " but got " + __str(actual), "expected property " + __str(name) + " to not equal " + __str(value)); }
	lengthOf(n) { const l = __len(this.obj); return this.__check(l === n, "expected " + __str(this.obj) + " to have length " + n + " but got " + l, "expected length to not be " + n); }
	length(n) { return this.lengthOf(n); }
}
function expect(obj) { return new Assertion(obj); }
function __headerList(headers) {
	const find = (n) => headers.find((h) => h.key.toLowerCase() === String(n).toLowerCase());
	return { get: (n) => (find(n) ? find(n).value : undefined), has: (n) => find(n) !== undefined };
}
const pm = {
	environment: __makeScope("environment"),
	globals: __makeScope("globals"),
	collectionVariables: __makeScope("collection"),
	iterationData: __makeScope("data"),
	variables: { get: (k) => __c("var", "get", k), set: (k, v) => __c("var", "set", k, v), has: (k) => __c("var", "has", k) },
	info: ${JSON.stringify({ requestName: ctx.requestName, eventName: ctx.eventName })},
	expect,
	request: {
		get method() { return __c("req", "getMethod"); },
		get url() { return __c("req", "getUrl"); }, set url(v) { __c("req", "setUrl", v); },
		get body() { return __c("req", "getBody"); }, set body(v) { __c("req", "setBody", v); },
		headers: {
			get: (n) => __c("req", "hGet", n), has: (n) => __c("req", "hHas", n),
			add: (h) => __c("req", "hAdd", h.key, h.value), upsert: (h) => __c("req", "hUpsert", h.key, h.value), remove: (n) => __c("req", "hRemove", n),
		},
	},
	test: (name, fn) => { try { fn(); __c("report", "push", name, true); } catch (e) { __c("report", "push", name, false, (e && e.message) ? e.message : String(e)); } },
	sendRequest: async (input, cb) => {
		const r = JSON.parse(await __send(JSON.stringify(typeof input === "string" ? { url: input } : input)));
		if (!r.ok) { const e = new Error(r.error); if (cb) { cb(e, null); return null; } throw e; }
		const res = r.v;
		const w = { code: res.code, status: res.status, headers: res.headers, text: () => res.body, json: () => JSON.parse(res.body) };
		if (cb) cb(null, w);
		return w;
	},
};
if (__c("res", "exists")) {
	const __rh = __c("res", "headers");
	pm.response = {
		code: __c("res", "code"), status: __c("res", "status"), responseTime: __c("res", "responseTime"),
		text: () => __c("res", "body"), json: () => JSON.parse(__c("res", "body")), headers: __headerList(__rh),
		to: {
			have: {
				status: (e) => { if (typeof e === "number") expect(pm.response.code).to.equal(e); else expect(pm.response.status).to.equal(e); },
				header: (n) => expect(pm.response.headers.has(n)).to.equal(true),
			},
			be: { get json() { JSON.parse(__c("res", "body")); return undefined; } },
		},
	};
}
const console = {
	log: (...a) => __log("log", __safe(a)), info: (...a) => __log("info", __safe(a)),
	warn: (...a) => __log("warn", __safe(a)), error: (...a) => __log("error", __safe(a)), debug: (...a) => __log("debug", __safe(a)),
};
function __safe(a) { try { return JSON.stringify(a); } catch { return JSON.stringify(a.map(String)); } }
`;
}

/** Build the host-side bridge dispatcher over the tested createPm engine. */
function makeDispatch(ctx: PmContext): { dispatch: (p: CallPayload) => unknown; results: TestResult[] } {
	const { pm, results } = createPm(ctx);
	const scopeOf: Record<string, VarScopeApi> = {
		environment: pm.environment as VarScopeApi,
		globals: pm.globals as VarScopeApi,
		collection: pm.collectionVariables as VarScopeApi,
		data: pm.iterationData as VarScopeApi,
	};
	const vars = pm.variables as VariablesApi;
	const request = pm.request as RequestApi;
	const response = pm.response as ResponseApi | undefined;

	function dispatch(p: CallPayload): unknown {
		const a = p.args;
		switch (p.ns) {
			case "var":
				if (p.op === "get") return vars.get(a[0] as string);
				if (p.op === "has") return vars.has(a[0] as string);
				vars.set(a[0] as string, a[1]);
				return undefined;
			case "environment":
			case "globals":
			case "collection":
			case "data": {
				const s = scopeOf[p.ns];
				switch (p.op) {
					case "get":
						return s.get(a[0] as string);
					case "set":
						s.set(a[0] as string, a[1]);
						return undefined;
					case "unset":
						s.unset(a[0] as string);
						return undefined;
					case "has":
						return s.has(a[0] as string);
					case "clear":
						s.clear();
						return undefined;
					default:
						return s.toObject();
				}
			}
			case "req":
				switch (p.op) {
					case "getMethod":
						return request.method;
					case "getUrl":
						return request.url;
					case "setUrl":
						request.url = a[0] as string;
						return undefined;
					case "getBody":
						return request.body;
					case "setBody":
						request.body = a[0] as string;
						return undefined;
					case "hGet":
						return request.headers.get(a[0] as string);
					case "hHas":
						return request.headers.has(a[0] as string);
					case "hAdd":
						request.headers.add({ key: a[0] as string, value: a[1] as string });
						return undefined;
					case "hUpsert":
						request.headers.upsert({ key: a[0] as string, value: a[1] as string });
						return undefined;
					default:
						request.headers.remove(a[0] as string);
						return undefined;
				}
			case "res":
				if (!response) return p.op === "exists" ? false : undefined;
				switch (p.op) {
					case "exists":
						return true;
					case "code":
						return response.code;
					case "status":
						return response.status;
					case "responseTime":
						return response.responseTime;
					case "body":
						return response.text();
					default:
						return ctx.response?.headers ?? [];
				}
			default:
				results.push({ name: a[0] as string, passed: a[1] as boolean, error: a[2] as string | undefined });
				return undefined;
		}
	}

	return { dispatch, results };
}

/**
 * Execute a single script against a {@link PmContext}, mutating it in place (vars +
 * request) and returning collected test results and console logs. Throws
 * {@link ScriptError} on a compile error or an uncaught throw outside `pm.test`.
 */
export async function runScript(source: string, ctx: PmContext): Promise<ScriptRunOutput> {
	const mod = await loadQuickjs();
	const vm = await mod.newAsyncContext();
	const logs: ConsoleLog[] = [];
	const { dispatch, results } = makeDispatch(ctx);

	try {
		const deadline = Date.now() + SCRIPT_TIMEOUT_MS;
		vm.runtime.setInterruptHandler(() => Date.now() > deadline);

		const callFn = vm.newFunction("__call", payload => vm.newString(JSON.stringify({ v: dispatch(JSON.parse(vm.getString(payload))) })));
		vm.setProp(vm.global, "__call", callFn);
		callFn.dispose();

		const logFn = vm.newFunction("__log", (levelH, argsH) => {
			let args: unknown[] = [];
			try {
				args = JSON.parse(vm.getString(argsH));
			} catch {
				args = [];
			}
			logs.push({ level: vm.getString(levelH) as ConsoleLog["level"], args });
		});
		vm.setProp(vm.global, "__log", logFn);
		logFn.dispose();

		const sendFn = vm.newAsyncifiedFunction("__send", async inputH => {
			const input = JSON.parse(vm.getString(inputH));
			try {
				if (!ctx.sendRequest) throw new Error("pm.sendRequest is not available in this context");
				const res = await ctx.sendRequest(input);
				return vm.newString(JSON.stringify({ ok: true, v: res }));
			} catch (err) {
				return vm.newString(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
			}
		});
		vm.setProp(vm.global, "__send", sendFn);
		sendFn.dispose();

		const full = `${bootstrap(ctx)}\n;(async () => {\n${source}\n})()`;
		const evalResult = await vm.evalCodeAsync(full);
		if (evalResult.error) {
			const message = String((vm.dump(evalResult.error) as { message?: unknown })?.message ?? vm.dump(evalResult.error));
			evalResult.error.dispose();
			throw new ScriptError(message);
		}
		const promise = evalResult.value;
		const settledHostPromise = vm.resolvePromise(promise);
		// Drive the VM job queue (microtasks + asyncified host calls) until the IIFE settles.
		while (vm.runtime.hasPendingJob()) vm.runtime.executePendingJobs();
		const settled = await settledHostPromise;
		while (vm.runtime.hasPendingJob()) vm.runtime.executePendingJobs();
		promise.dispose();
		if (settled.error) {
			const message = String((vm.dump(settled.error) as { message?: unknown })?.message ?? vm.dump(settled.error));
			settled.error.dispose();
			throw new ScriptError(message);
		}
		settled.value.dispose();

		return { results, logs };
	} finally {
		vm.dispose();
	}
}
