import { isTauri } from "@tauri-apps/api/core";
import { applyAuth } from "@/lib/auth/apply";
import { webAdapter } from "@/lib/http/adapters/web";
import { normalizeResponse } from "@/lib/http/normalize";
import { serializeRequest } from "@/lib/http/serialize";
import type { HttpAdapter, HttpClient, NormalizedResponse, SerializedRequest } from "@/lib/http/types";
import type { HttpMethod, RequestModel } from "@/lib/request/model";
import { runPreRequest, runTests } from "@/lib/scripting/run";
import type { ScriptResponseView, SendRequestFn } from "@/lib/scripting/types";
import { interpolateRequest } from "@/lib/vars/interpolate";
import type { VarScope } from "@/lib/vars/interpolate";

async function resolveAdapter(): Promise<HttpAdapter> {
	if (isTauri()) {
		const { nativeAdapter } = await import("@/lib/http/adapters/native");
		return nativeAdapter;
	}
	return webAdapter;
}

/** A bare adapter round-trip, used to back `pm.sendRequest` from inside scripts. */
function makeSendRequest(adapter: HttpAdapter): SendRequestFn {
	return async input => {
		const serialized: SerializedRequest = {
			method: (input.method ?? "GET") as HttpMethod,
			url: input.url,
			headers: input.headers ?? {},
			body: input.body,
		};
		const start = performance.now();
		const raw = await adapter(serialized);
		const norm = normalizeResponse(raw, Math.round(performance.now() - start));
		return { code: norm.status, status: norm.statusText, headers: norm.headers, body: norm.bodyText };
	};
}

/** Run the full send pipeline against a given adapter. Exposed for testing. */
export async function sendWith(adapter: HttpAdapter, req: RequestModel, scope: VarScope): Promise<NormalizedResponse> {
	const sendRequest = makeSendRequest(adapter);

	// 1. Pre-request script may mutate the request and write variables.
	const pre = await runPreRequest(req, scope, { sendRequest });

	// 2. Interpolate → serialize → auth → send → normalize.
	const interpolated = interpolateRequest(pre.request, pre.scope);
	const serialized = serializeRequest(interpolated);
	const authHeaders = await applyAuth(serialized, interpolated.auth);
	const finalReq = { ...serialized, headers: { ...serialized.headers, ...authHeaders } };
	const start = performance.now();
	const raw = await adapter(finalReq);
	const normalized = normalizeResponse(raw, Math.round(performance.now() - start));

	// 3. Test script runs against the response; collects assertions + variable writes.
	const responseView: ScriptResponseView = {
		code: normalized.status,
		status: normalized.statusText,
		headers: normalized.headers,
		body: normalized.bodyText,
		responseTime: normalized.timeMs,
	};
	const tested = await runTests(pre.request, responseView, pre.scope, { sendRequest });

	const logs = [...pre.logs, ...tested.logs];
	return {
		...normalized,
		tests: tested.results.length > 0 ? tested.results : undefined,
		consoleLogs: logs.length > 0 ? logs : undefined,
		scriptVars: tested.scope,
	};
}

export const httpClient: HttpClient = {
	async send(req, scope) {
		const adapter = await resolveAdapter();
		return sendWith(adapter, req, scope);
	},
};
