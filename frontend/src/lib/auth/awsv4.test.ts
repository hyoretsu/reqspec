import { describe, expect, it } from "bun:test";
import { deriveSigningKey, sha256Hex, signRequest } from "@/lib/auth/awsv4";
import type { SerializedRequest } from "@/lib/http/types";

function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

describe("sha256Hex", () => {
	it("hashes the empty string to the known SHA-256 value", async () => {
		expect(await sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
	});
});

describe("deriveSigningKey", () => {
	it("matches the AWS documentation example signing key", async () => {
		const key = await deriveSigningKey(
			"wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
			"20120215",
			"us-east-1",
			"iam",
		);
		expect(toHex(key)).toBe("f4780e2d9f65fa895f9c67b32ce1baf0b0d8a43505a000a1a9e090d414db404d");
	});
});

describe("signRequest", () => {
	const creds = {
		accessKeyId: "AKIDEXAMPLE",
		secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
		region: "us-east-1",
		service: "service",
	};
	const date = new Date("2015-08-30T12:36:00Z");

	function req(partial: Partial<SerializedRequest> = {}): SerializedRequest {
		return { method: "GET", url: "https://example.amazonaws.com/", headers: {}, body: undefined, ...partial };
	}

	it("produces the canonical SigV4 authorization header", async () => {
		const headers = await signRequest(req(), creds, date);
		expect(headers["x-amz-date"]).toBe("20150830T123600Z");
		expect(headers["x-amz-content-sha256"]).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
		expect(headers.Authorization).toContain(
			"AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request",
		);
		expect(headers.Authorization).toContain("SignedHeaders=host;x-amz-content-sha256;x-amz-date");
		expect(headers.Authorization).toMatch(/Signature=[0-9a-f]{64}$/);
	});

	it("is deterministic for the same inputs", async () => {
		const a = await signRequest(req(), creds, date);
		const b = await signRequest(req(), creds, date);
		expect(a.Authorization).toBe(b.Authorization);
	});

	it("includes the session token header when present", async () => {
		const headers = await signRequest(req(), { ...creds, sessionToken: "tok" }, date);
		expect(headers["x-amz-security-token"]).toBe("tok");
	});

	it("returns no headers for an unparseable url or a FormData body", async () => {
		expect(await signRequest(req({ url: "bad" }), creds, date)).toEqual({});
		expect(await signRequest(req({ body: new FormData() }), creds, date)).toEqual({});
	});
});
