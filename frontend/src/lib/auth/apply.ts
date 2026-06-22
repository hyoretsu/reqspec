import { signRequest } from "@/lib/auth/awsv4";
import type { SerializedRequest } from "@/lib/http/types";
import type { AuthDescriptor } from "@/lib/request/model";

/**
 * Async auth that can't run during serialization. Returns extra headers to merge.
 * Currently only AWS SigV4 (needs Web Crypto + the serialized body/url); basic/bearer/
 * apikey/oauth2-token are already applied synchronously in serializeRequest.
 */
export async function applyAuth(req: SerializedRequest, auth: AuthDescriptor): Promise<Record<string, string>> {
	if (auth.type === "awsv4") {
		return signRequest(req, {
			accessKeyId: auth.accessKeyId,
			secretAccessKey: auth.secretAccessKey,
			region: auth.region,
			service: auth.service,
			sessionToken: auth.sessionToken,
		});
	}
	return {};
}
