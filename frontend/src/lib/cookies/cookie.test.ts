import { describe, expect, it } from "bun:test";
import {
	cookieFromResponse,
	cookieMatches,
	isExpired,
	parseCookieAttributes,
	serializeCookieHeader,
	urlHostPath,
} from "@/lib/cookies/cookie";
import type { CookieRow } from "@/lib/db/types";

function cookie(partial: Partial<CookieRow> = {}): CookieRow {
	return {
		id: "1",
		domain: "example.com",
		path: "/",
		name: "sid",
		value: "abc",
		expires: null,
		secure: false,
		httpOnly: false,
		sameSite: null,
		createdAt: 0,
		...partial,
	};
}

describe("parseCookieAttributes", () => {
	it("parses path, domain, secure, httponly, samesite", () => {
		const attrs = parseCookieAttributes("Path=/api; Domain=.example.com; Secure; HttpOnly; SameSite=Lax");
		expect(attrs).toMatchObject({
			path: "/api",
			domain: "example.com",
			secure: true,
			httpOnly: true,
			sameSite: "Lax",
		});
	});

	it("computes expiry from Max-Age", () => {
		const before = Date.now();
		const attrs = parseCookieAttributes("Max-Age=60");
		expect(attrs.expires).toBeGreaterThanOrEqual(before + 59_000);
	});

	it("defaults path to / and ignores empty segments", () => {
		expect(parseCookieAttributes("")).toMatchObject({ path: "/", domain: null, secure: false });
	});
});

describe("cookieFromResponse", () => {
	it("uses the cookie Domain attribute when present, else the request host", () => {
		expect(cookieFromResponse("api.test", { name: "a", value: "1", attributes: "Domain=test.com" }).domain).toBe(
			"test.com",
		);
		expect(cookieFromResponse("api.test", { name: "a", value: "1", attributes: "" }).domain).toBe("api.test");
	});
});

describe("cookieMatches", () => {
	it("matches exact host and subdomains, and path prefixes", () => {
		expect(cookieMatches(cookie({ domain: "example.com", path: "/api" }), "example.com", "/api/users")).toBe(true);
		expect(cookieMatches(cookie({ domain: "example.com" }), "app.example.com", "/")).toBe(true);
		expect(cookieMatches(cookie({ domain: "example.com", path: "/api" }), "example.com", "/other")).toBe(false);
		expect(cookieMatches(cookie({ domain: "example.com" }), "evil.com", "/")).toBe(false);
	});
});

describe("isExpired", () => {
	it("treats null expiry as session (not expired) and past expiry as expired", () => {
		expect(isExpired(cookie({ expires: null }))).toBe(false);
		expect(isExpired(cookie({ expires: 1000 }), 2000)).toBe(true);
		expect(isExpired(cookie({ expires: 5000 }), 2000)).toBe(false);
	});
});

describe("serializeCookieHeader + urlHostPath", () => {
	it("joins cookies into a header", () => {
		expect(serializeCookieHeader([cookie({ name: "a", value: "1" }), cookie({ name: "b", value: "2" })])).toBe(
			"a=1; b=2",
		);
	});

	it("extracts host and path, returning null for bad urls", () => {
		expect(urlHostPath("https://api.test/v1/users?x=1")).toEqual({ host: "api.test", path: "/v1/users" });
		expect(urlHostPath("not a url")).toBeNull();
	});
});
