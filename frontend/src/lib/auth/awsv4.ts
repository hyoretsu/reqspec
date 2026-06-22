import type { SerializedRequest } from "@/lib/http/types";

export interface AwsCredentials {
	accessKeyId: string;
	secretAccessKey: string;
	region: string;
	service: string;
	sessionToken?: string;
}

const encoder = new TextEncoder();
const ALGORITHM = "AWS4-HMAC-SHA256";

function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(data: string): Promise<string> {
	return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(data)));
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
	const cryptoKey = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, [
		"sign",
	]);
	return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

/** Derive the SigV4 signing key (kSigning) from the secret + scope parts. */
export async function deriveSigningKey(
	secret: string,
	dateStamp: string,
	region: string,
	service: string,
): Promise<ArrayBuffer> {
	const kDate = await hmac(encoder.encode(`AWS4${secret}`), dateStamp);
	const kRegion = await hmac(kDate, region);
	const kService = await hmac(kRegion, service);
	return hmac(kService, "aws4_request");
}

/** YYYYMMDDTHHMMSSZ */
function amzDate(date: Date): string {
	return `${date.toISOString().replace(/[:-]|\.\d{3}/g, "")}`;
}

function canonicalQuery(search: URLSearchParams): string {
	const pairs = [...search.entries()].map(
		([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)] as [string, string],
	);
	pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1));
	return pairs.map(([k, v]) => `${k}=${v}`).join("&");
}

/** Compute the SigV4 headers to add to a request. Returns {} for non-string bodies (can't hash). */
export async function signRequest(
	req: SerializedRequest,
	creds: AwsCredentials,
	now: Date = new Date(),
): Promise<Record<string, string>> {
	let url: URL;
	try {
		url = new URL(req.url);
	} catch {
		return {};
	}
	if (typeof req.body !== "string" && req.body !== undefined) return {};

	const amz = amzDate(now);
	const dateStamp = amz.slice(0, 8);
	const payloadHash = await sha256Hex(typeof req.body === "string" ? req.body : "");

	const signedHeadersMap: Record<string, string> = {
		host: url.host,
		"x-amz-content-sha256": payloadHash,
		"x-amz-date": amz,
	};
	const signedHeaderNames = Object.keys(signedHeadersMap).sort();
	const canonicalHeaders = signedHeaderNames.map(h => `${h}:${signedHeadersMap[h]}\n`).join("");
	const signedHeaders = signedHeaderNames.join(";");

	const canonicalRequest = [
		req.method,
		url.pathname || "/",
		canonicalQuery(url.searchParams),
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join("\n");

	const scope = `${dateStamp}/${creds.region}/${creds.service}/aws4_request`;
	const stringToSign = [ALGORITHM, amz, scope, await sha256Hex(canonicalRequest)].join("\n");

	const signingKey = await deriveSigningKey(creds.secretAccessKey, dateStamp, creds.region, creds.service);
	const signature = toHex(await hmac(signingKey, stringToSign));

	const authorization = `${ALGORITHM} Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

	const headers: Record<string, string> = {
		Authorization: authorization,
		"x-amz-date": amz,
		"x-amz-content-sha256": payloadHash,
	};
	if (creds.sessionToken && creds.sessionToken !== "") headers["x-amz-security-token"] = creds.sessionToken;
	return headers;
}
