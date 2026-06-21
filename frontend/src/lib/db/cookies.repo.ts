import { db } from "@/lib/db/db";
import { cookieFromResponse, cookieMatches, isExpired } from "@/lib/cookies/cookie";
import type { CookieRow } from "@/lib/db/types";
import type { ParsedCookie } from "@/lib/http/types";

export function listCookies(): Promise<CookieRow[]> {
	return db.cookies.orderBy("domain").toArray();
}

/** Cookies that should be sent to the given host/path (expired ones excluded). */
export async function matchingCookies(host: string, path: string): Promise<CookieRow[]> {
	const all = await db.cookies.toArray();
	const now = Date.now();
	return all.filter(c => !isExpired(c, now) && cookieMatches(c, host, path));
}

/** Persist Set-Cookie entries from a response, replacing any with the same domain/path/name. */
export async function storeFromResponse(requestHost: string, parsed: ParsedCookie[]): Promise<void> {
	if (parsed.length === 0) return;
	await db.transaction("rw", db.cookies, async () => {
		for (const p of parsed) {
			const cookie = cookieFromResponse(requestHost, p);
			const existing = await db.cookies
				.where("name")
				.equals(cookie.name)
				.filter(c => c.domain === cookie.domain && c.path === cookie.path)
				.first();
			if (existing) await db.cookies.delete(existing.id);
			await db.cookies.add(cookie);
		}
	});
}

export async function deleteCookie(id: string): Promise<void> {
	await db.cookies.delete(id);
}

export async function clearCookies(): Promise<void> {
	await db.cookies.clear();
}
