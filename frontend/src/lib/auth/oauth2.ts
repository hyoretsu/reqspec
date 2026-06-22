import ky from "ky";
import type { AuthDescriptor } from "@/lib/request/model";

type OAuth2Auth = Extract<AuthDescriptor, { type: "oauth2" }>;

export interface TokenRequest {
	url: string;
	headers: Record<string, string>;
	body: string;
}

/** Build the OAuth2 token-endpoint request for client-credentials or password grants. Pure. */
export function buildTokenRequest(auth: OAuth2Auth): TokenRequest {
	const params = new URLSearchParams();
	params.set("grant_type", auth.grantType);
	if (auth.scope !== "") params.set("scope", auth.scope);
	if (auth.grantType === "password") {
		params.set("username", auth.username);
		params.set("password", auth.password);
	}
	// Client credentials go in the Authorization header (Basic), per RFC 6749 §2.3.1.
	const basic = btoa(`${auth.clientId}:${auth.clientSecret}`);
	return {
		url: auth.tokenUrl,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
			Authorization: `Basic ${basic}`,
		},
		body: params.toString(),
	};
}

interface TokenResponse {
	access_token?: string;
	error?: string;
	error_description?: string;
}

/** Fetch an access token. Throws with the provider error on failure. */
export async function fetchToken(auth: OAuth2Auth): Promise<string> {
	if (auth.grantType === "token") return auth.accessToken;
	const req = buildTokenRequest(auth);
	const res = await ky.post(req.url, {
		headers: req.headers,
		body: req.body,
		throwHttpErrors: false,
		retry: 0,
	});
	const json = (await res.json().catch(() => ({}))) as TokenResponse;
	if (!res.ok || !json.access_token) {
		throw new Error(json.error_description || json.error || `Token request failed (${res.status})`);
	}
	return json.access_token;
}
