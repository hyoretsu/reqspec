import type { KeyValue, RequestModel } from "@/lib/request/model";
import type { SerializedRequest } from "@/lib/http/types";

function enabledPairs(items: KeyValue[]): [string, string][] {
	return items.filter(i => i.enabled && i.key !== "").map(i => [i.key, i.value]);
}

function buildUrl(url: string, pairs: [string, string][]): string {
	if (pairs.length === 0) return url;
	const query = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
	const separator = url.includes("?") ? "&" : "?";
	return `${url}${separator}${query}`;
}

function base64(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

/** Serialize a (already interpolated) request into transport-ready primitives. Pure.
 * Sync auth (basic/bearer/apikey/oauth2 token) is applied here; awsv4 signing happens
 * asynchronously in the send pipeline (see lib/auth/apply). */
export function serializeRequest(req: RequestModel): SerializedRequest {
	const headers: Record<string, string> = {};
	for (const [key, value] of enabledPairs(req.headers)) headers[key] = value;

	const auth = req.auth;
	const extraQuery: [string, string][] = [];
	if (auth.type === "basic") {
		headers.Authorization = `Basic ${base64(`${auth.username}:${auth.password}`)}`;
	} else if (auth.type === "bearer") {
		headers.Authorization = `Bearer ${auth.token}`;
	} else if (auth.type === "oauth2") {
		if (auth.accessToken !== "") headers.Authorization = `Bearer ${auth.accessToken}`;
	} else if (auth.type === "apikey" && auth.key !== "") {
		if (auth.addTo === "header") headers[auth.key] = auth.value;
		else extraQuery.push([auth.key, auth.value]);
	}

	let body: string | FormData | undefined;
	switch (req.body.type) {
		case "raw": {
			body = req.body.content;
			if (!hasHeader(headers, "content-type")) {
				headers["Content-Type"] = req.body.subtype === "json" ? "application/json" : "text/plain";
			}
			break;
		}
		case "urlencoded": {
			body = enabledPairs(req.body.fields)
				.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
				.join("&");
			if (!hasHeader(headers, "content-type")) {
				headers["Content-Type"] = "application/x-www-form-urlencoded";
			}
			break;
		}
		case "form-data": {
			const form = new FormData();
			for (const [k, v] of enabledPairs(req.body.fields)) form.append(k, v);
			body = form;
			// Content-Type (with boundary) is set by the transport for FormData.
			break;
		}
		default:
			body = undefined;
	}

	return {
		method: req.method,
		url: buildUrl(req.url, enabledPairs(req.params).concat(extraQuery)),
		headers,
		body,
	};
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
	const lower = name.toLowerCase();
	return Object.keys(headers).some(k => k.toLowerCase() === lower);
}
