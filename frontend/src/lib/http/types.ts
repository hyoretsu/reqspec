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
}

export interface HttpClient {
	send(req: RequestModel, scope: VarScope): Promise<NormalizedResponse>;
}

export type HttpAdapter = (req: SerializedRequest) => Promise<RawHttpResponse>;
