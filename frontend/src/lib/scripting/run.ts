import { createKeyValue, getEventScript } from "@/lib/request/model";
import type { BodyDescriptor, RequestModel } from "@/lib/request/model";
import { runScript as defaultRunScript } from "@/lib/scripting/sandbox";
import type {
	ConsoleLog,
	PmContext,
	ScriptRequestView,
	ScriptResponseView,
	ScriptRunOutput,
	SendRequestFn,
	TestResult,
} from "@/lib/scripting/types";
import type { VarScope } from "@/lib/vars/interpolate";

export type RunScriptFn = (source: string, ctx: PmContext) => Promise<ScriptRunOutput>;

export interface ScriptDeps {
	/** Sandbox runner; injectable so the orchestration is unit-testable without QuickJS. */
	runScript?: RunScriptFn;
	/** Host implementation backing `pm.sendRequest`. */
	sendRequest?: SendRequestFn;
}

/** The textual `pm.request.body` a script sees. Only `raw`/`graphql` have a meaningful string. */
function bodyToString(body: BodyDescriptor): string {
	if (body.type === "raw") return body.content;
	if (body.type === "graphql") return JSON.stringify({ query: body.query, variables: body.variables });
	return "";
}

function requestView(req: RequestModel): ScriptRequestView {
	return {
		method: req.method,
		url: req.url,
		headers: req.headers.filter(h => h.enabled && h.key !== "").map(h => ({ key: h.key, value: h.value })),
		body: bodyToString(req.body),
	};
}

function scopeToVars(scope: VarScope): PmContext["vars"] {
	return {
		environment: { ...scope.environment },
		globals: { ...scope.globals },
		collection: { ...scope.collection },
		local: { ...scope.local },
		data: { ...scope.data },
	};
}

function varsToScope(vars: PmContext["vars"]): VarScope {
	return {
		local: { ...vars.local },
		data: { ...vars.data },
		environment: { ...vars.environment },
		collection: { ...vars.collection },
		globals: { ...vars.globals },
	};
}

/** Fold a script's (possibly mutated) request view back into a send-ready RequestModel. */
function applyRequestView(req: RequestModel, view: ScriptRequestView): RequestModel {
	const headers = view.headers.map(h => createKeyValue({ key: h.key, value: h.value }));
	// Only `raw` bodies round-trip a string mutation; other body types are left untouched.
	const body: BodyDescriptor = req.body.type === "raw" ? { ...req.body, content: view.body } : req.body;
	return { ...req, url: view.url, headers, body };
}

/**
 * Run the request's pre-request script (if any). Returns a send-ready request reflecting
 * any `pm.request.*` mutations, the updated variable scope, and captured console logs.
 * A no-script request is returned untouched.
 */
export async function runPreRequest(
	req: RequestModel,
	scope: VarScope,
	deps: ScriptDeps = {},
): Promise<{ request: RequestModel; scope: VarScope; logs: ConsoleLog[] }> {
	const source = getEventScript(req.events, "prerequest");
	if (source.trim() === "") return { request: req, scope, logs: [] };

	const runScript = deps.runScript ?? defaultRunScript;
	const ctx: PmContext = {
		request: requestView(req),
		vars: scopeToVars(scope),
		requestName: "",
		eventName: "prerequest",
		sendRequest: deps.sendRequest,
	};
	const { logs } = await runScript(source, ctx);
	return { request: applyRequestView(req, ctx.request), scope: varsToScope(ctx.vars), logs };
}

/**
 * Run the request's test script (if any) against the received response. Returns the test
 * results, the updated variable scope, and captured console logs. A no-script request
 * yields empty results.
 */
export async function runTests(
	req: RequestModel,
	response: ScriptResponseView,
	scope: VarScope,
	deps: ScriptDeps = {},
): Promise<{ results: TestResult[]; scope: VarScope; logs: ConsoleLog[] }> {
	const source = getEventScript(req.events, "test");
	if (source.trim() === "") return { results: [], scope, logs: [] };

	const runScript = deps.runScript ?? defaultRunScript;
	const ctx: PmContext = {
		request: requestView(req),
		response,
		vars: scopeToVars(scope),
		requestName: "",
		eventName: "test",
		sendRequest: deps.sendRequest,
	};
	const { results, logs } = await runScript(source, ctx);
	return { results, scope: varsToScope(ctx.vars), logs };
}
