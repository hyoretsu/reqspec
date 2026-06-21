import type { CookieRow } from "@/lib/db/types";
import type { ParsedCookie } from "@/lib/http/types";

export interface CookieAttributes {
	path: string;
	domain: string | null;
	expires: number | null;
	secure: boolean;
	httpOnly: boolean;
	sameSite: string | null;
}

/** Parse the attribute segment of a Set-Cookie header (everything after `name=value`). */
export function parseCookieAttributes(attributes: string): CookieAttributes {
	const result: CookieAttributes = {
		path: "/",
		domain: null,
		expires: null,
		secure: false,
		httpOnly: false,
		sameSite: null,
	};
	for (const part of attributes.split(";")) {
		const trimmed = part.trim();
		if (trimmed === "") continue;
		const eq = trimmed.indexOf("=");
		const key = (eq === -1 ? trimmed : trimmed.slice(0, eq)).toLowerCase();
		const value = eq === -1 ? "" : trimmed.slice(eq + 1).trim();
		switch (key) {
			case "path":
				result.path = value || "/";
				break;
			case "domain":
				result.domain = value.replace(/^\./, "") || null;
				break;
			case "expires": {
				const ms = Date.parse(value);
				if (!Number.isNaN(ms)) result.expires = ms;
				break;
			}
			case "max-age": {
				const secs = Number(value);
				if (!Number.isNaN(secs)) result.expires = Date.now() + secs * 1000;
				break;
			}
			case "secure":
				result.secure = true;
				break;
			case "httponly":
				result.httpOnly = true;
				break;
			case "samesite":
				result.sameSite = value || null;
				break;
		}
	}
	return result;
}

/** Build a stored cookie from a parsed Set-Cookie and the responding request's host. */
export function cookieFromResponse(requestDomain: string, parsed: ParsedCookie): CookieRow {
	const attrs = parseCookieAttributes(parsed.attributes);
	return {
		id: crypto.randomUUID(),
		domain: attrs.domain ?? requestDomain,
		path: attrs.path,
		name: parsed.name,
		value: parsed.value,
		expires: attrs.expires,
		secure: attrs.secure,
		httpOnly: attrs.httpOnly,
		sameSite: attrs.sameSite,
		createdAt: Date.now(),
	};
}

function domainMatches(cookieDomain: string, host: string): boolean {
	return host === cookieDomain || host.endsWith(`.${cookieDomain}`);
}

/** Whether a cookie should be sent to the given host/path (ignores expiry). */
export function cookieMatches(cookie: CookieRow, host: string, path: string): boolean {
	return domainMatches(cookie.domain, host) && path.startsWith(cookie.path);
}

export function isExpired(cookie: CookieRow, now = Date.now()): boolean {
	return cookie.expires !== null && cookie.expires <= now;
}

/** Build a `Cookie` request header value from matching cookies. */
export function serializeCookieHeader(cookies: CookieRow[]): string {
	return cookies.map(c => `${c.name}=${c.value}`).join("; ");
}

/** Extract the host and path from a URL; returns null if unparseable. */
export function urlHostPath(url: string): { host: string; path: string } | null {
	try {
		const u = new URL(url);
		return { host: u.hostname, path: u.pathname || "/" };
	} catch {
		return null;
	}
}
