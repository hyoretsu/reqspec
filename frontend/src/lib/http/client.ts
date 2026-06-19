import { isTauri } from "@tauri-apps/api/core";
import { webAdapter } from "@/lib/http/adapters/web";
import { normalizeResponse } from "@/lib/http/normalize";
import { serializeRequest } from "@/lib/http/serialize";
import type { HttpAdapter, HttpClient, NormalizedResponse } from "@/lib/http/types";
import type { RequestModel } from "@/lib/request/model";
import { interpolateRequest } from "@/lib/vars/interpolate";
import type { VarScope } from "@/lib/vars/interpolate";

async function resolveAdapter(): Promise<HttpAdapter> {
	if (isTauri()) {
		const { nativeAdapter } = await import("@/lib/http/adapters/native");
		return nativeAdapter;
	}
	return webAdapter;
}

/** Run the full send pipeline against a given adapter. Exposed for testing. */
export async function sendWith(
	adapter: HttpAdapter,
	req: RequestModel,
	scope: VarScope,
): Promise<NormalizedResponse> {
	const serialized = serializeRequest(interpolateRequest(req, scope));
	const start = performance.now();
	const raw = await adapter(serialized);
	return normalizeResponse(raw, Math.round(performance.now() - start));
}

export const httpClient: HttpClient = {
	async send(req, scope) {
		const adapter = await resolveAdapter();
		return sendWith(adapter, req, scope);
	},
};
