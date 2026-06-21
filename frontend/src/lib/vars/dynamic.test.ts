import { describe, expect, it } from "bun:test";
import { DYNAMIC_VARIABLE_NAMES, resolveDynamic } from "@/lib/vars/dynamic";

describe("resolveDynamic", () => {
	it("returns null for non-dynamic names", () => {
		expect(resolveDynamic("host")).toBeNull();
	});

	it("returns null for unknown dynamic names", () => {
		expect(resolveDynamic("$unknown")).toBeNull();
	});

	it("resolves a guid as a UUID", () => {
		expect(resolveDynamic("$guid")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});

	it("resolves a unix timestamp", () => {
		expect(resolveDynamic("$timestamp")).toMatch(/^\d+$/);
	});

	it("resolves an ISO timestamp", () => {
		expect(new Date(resolveDynamic("$isoTimestamp") as string).toString()).not.toBe("Invalid Date");
	});

	it("resolves a random integer", () => {
		const n = Number(resolveDynamic("$randomInt"));
		expect(Number.isInteger(n)).toBe(true);
		expect(n).toBeGreaterThanOrEqual(0);
	});

	it("resolves a random email", () => {
		expect(resolveDynamic("$randomEmail")).toContain("@example.com");
	});

	it("resolves a boolean string", () => {
		expect(["true", "false"]).toContain(resolveDynamic("$randomBoolean") as string);
	});

	it("exposes every resolver name and they all resolve to a string", () => {
		expect(DYNAMIC_VARIABLE_NAMES.length).toBeGreaterThan(5);
		for (const name of DYNAMIC_VARIABLE_NAMES) {
			expect(typeof resolveDynamic(`$${name}`)).toBe("string");
		}
	});
});
