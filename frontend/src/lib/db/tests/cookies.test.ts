import { beforeEach, describe, expect, it } from "bun:test";
import { db } from "@/lib/db/db";
import * as cookiesRepo from "@/lib/db/cookies.repo";

beforeEach(async () => {
	await db.cookies.clear();
});

describe("cookies repo", () => {
	it("stores cookies and replaces ones with the same domain/path/name", async () => {
		await cookiesRepo.storeFromResponse("example.com", [
			{ name: "sid", value: "1", attributes: "Path=/" },
		]);
		await cookiesRepo.storeFromResponse("example.com", [
			{ name: "sid", value: "2", attributes: "Path=/" },
		]);
		const all = await cookiesRepo.listCookies();
		expect(all).toHaveLength(1);
		expect(all[0].value).toBe("2");
	});

	it("returns only matching, non-expired cookies", async () => {
		await cookiesRepo.storeFromResponse("example.com", [
			{ name: "a", value: "1", attributes: "Path=/api" },
			{ name: "b", value: "2", attributes: "Path=/; Max-Age=-1" },
		]);
		await cookiesRepo.storeFromResponse("other.com", [{ name: "c", value: "3", attributes: "Path=/" }]);

		const matched = await cookiesRepo.matchingCookies("example.com", "/api/users");
		expect(matched.map(c => c.name)).toEqual(["a"]);
	});

	it("deletes a cookie", async () => {
		await cookiesRepo.storeFromResponse("example.com", [{ name: "a", value: "1", attributes: "" }]);
		const [c] = await cookiesRepo.listCookies();
		await cookiesRepo.deleteCookie(c.id);
		expect(await cookiesRepo.listCookies()).toHaveLength(0);
	});
});
