import type { NormalizedResponse, ParsedCookie, RawHttpResponse } from "@/lib/http/types";

function parseCookie(raw: string): ParsedCookie {
	const [pair, ...rest] = raw.split(";");
	const eq = pair.indexOf("=");
	const name = eq === -1 ? pair.trim() : pair.slice(0, eq).trim();
	const value = eq === -1 ? "" : pair.slice(eq + 1).trim();
	return { name, value, attributes: rest.map(a => a.trim()).join("; ") };
}

function decodeBody(bytes: Uint8Array): string {
	return new TextDecoder("utf-8").decode(bytes);
}

/** Convert a raw adapter response into the normalized shape the UI consumes. Pure. */
export function normalizeResponse(raw: RawHttpResponse, timeMs: number): NormalizedResponse {
	const headers = raw.headers.map(([key, value]) => ({ key, value }));
	const cookies = raw.headers
		.filter(([key]) => key.toLowerCase() === "set-cookie")
		.map(([, value]) => parseCookie(value));

	return {
		status: raw.status,
		statusText: raw.statusText,
		headers,
		bodyText: decodeBody(raw.bodyBytes),
		bodyBytes: raw.bodyBytes.byteLength,
		contentType: raw.contentType,
		cookies,
		timeMs,
		error: raw.error,
	};
}

const PRETTY_TYPES = ["application/json", "+json"];

/** Pretty-print a JSON body for display; returns input unchanged if not JSON-parseable. */
export function prettyPrintBody(bodyText: string, contentType: string | undefined): string {
	const isJson = contentType ? PRETTY_TYPES.some(t => contentType.includes(t)) : false;
	if (!isJson) return bodyText;
	try {
		return JSON.stringify(JSON.parse(bodyText), null, 2);
	} catch {
		return bodyText;
	}
}
