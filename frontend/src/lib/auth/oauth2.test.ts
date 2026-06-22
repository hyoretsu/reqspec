import { describe, expect, it } from "bun:test";
import { buildTokenRequest } from "@/lib/auth/oauth2";
import type { AuthDescriptor } from "@/lib/request/model";

type OAuth2Auth = Extract<AuthDescriptor, { type: "oauth2" }>;

function oauth(partial: Partial<OAuth2Auth> = {}): OAuth2Auth {
	return {
		type: "oauth2",
		grantType: "client_credentials",
		accessToken: "",
		tokenUrl: "https://auth.test/token",
		clientId: "id",
		clientSecret: "secret",
		username: "",
		password: "",
		scope: "",
		...partial,
	};
}

describe("buildTokenRequest", () => {
	it("builds a client-credentials request with Basic auth", () => {
		const req = buildTokenRequest(oauth({ scope: "read" }));
		expect(req.url).toBe("https://auth.test/token");
		expect(req.headers.Authorization).toBe(`Basic ${btoa("id:secret")}`);
		expect(req.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
		expect(req.body).toBe("grant_type=client_credentials&scope=read");
	});

	it("includes username/password for the password grant", () => {
		const req = buildTokenRequest(oauth({ grantType: "password", username: "u", password: "p" }));
		const params = new URLSearchParams(req.body);
		expect(params.get("grant_type")).toBe("password");
		expect(params.get("username")).toBe("u");
		expect(params.get("password")).toBe("p");
	});

	it("omits scope when empty", () => {
		expect(buildTokenRequest(oauth()).body).toBe("grant_type=client_credentials");
	});
});
