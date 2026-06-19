import ky from "ky";
import type { RawHttpResponse, SerializedRequest } from "@/lib/http/types";

type FetchLike = typeof globalThis.fetch;

/**
 * Shared ky runner. The only difference between adapters is the injected `fetch`
 * implementation (browser global vs Tauri plugin-http). ky config is identical:
 * never throw on HTTP error status (an API client must surface 4xx/5xx as data).
 */
export async function runRequest(req: SerializedRequest, fetchImpl: FetchLike): Promise<RawHttpResponse> {
	try {
		const res = await ky(req.url, {
			method: req.method,
			headers: req.headers,
			body: req.body,
			throwHttpErrors: false,
			retry: 0,
			timeout: 60_000,
			fetch: fetchImpl,
		});

		const buffer = await res.arrayBuffer();
		const headers: [string, string][] = [];
		res.headers.forEach((value, key) => headers.push([key, value]));

		return {
			status: res.status,
			statusText: res.statusText,
			headers,
			bodyBytes: new Uint8Array(buffer),
			contentType: res.headers.get("content-type") ?? undefined,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "Request failed";
		return {
			status: 0,
			statusText: "",
			headers: [],
			bodyBytes: new Uint8Array(),
			contentType: undefined,
			error: `Request failed (possibly CORS, network, or timeout): ${message}`,
		};
	}
}
