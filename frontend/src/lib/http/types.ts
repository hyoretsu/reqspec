import type { HttpMethod, RequestModel } from "@/lib/request/model";
import type { VarScope } from "@/lib/vars/interpolate";

export interface SerializedRequest {
	method: HttpMethod;
	url: string;
	headers: Record<string, string>;
	body: string | FormData | Blob | undefined;
}

/** Raw shape every adapter produces before normalization. */
export interface RawHttpResponse {
	status: number;
	statusText: string;
	headers: [string, string][];
	bodyBytes: Uint8Array;
	contentType: string | undefined;
	/** Set when the request failed before producing an HTTP response (network/CORS). */
	error?: string;
}

export interface ParsedCookie {
	name: string;
	value: string;
	attributes: string;
}

export interface NormalizedResponse {
	status: number;
	statusText: string;
	headers: { key: string; value: string }[];
	bodyText: string;
	bodyBytes: number;
	contentType: string | undefined;
	cookies: ParsedCookie[];
	timeMs: number;
	error?: string;
	/** Results of `pm.test(...)` assertions from the request's test script, if any. */
	tests?: import("@/lib/scripting/types").TestResult[];
	/** `console.*` output captured across the pre-request and test scripts. */
	consoleLogs?: import("@/lib/scripting/types").ConsoleLog[];
	/** Final variable scope after running scripts, for the caller to persist. */
	scriptVars?: VarScope;
}

export interface HttpClient {
	send(req: RequestModel, scope: VarScope): Promise<NormalizedResponse>;
}

export type HttpAdapter = (req: SerializedRequest) => Promise<RawHttpResponse>;
