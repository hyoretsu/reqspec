import { describe, expect, test } from "bun:test";
import type { VariableRow } from "@/lib/db/types";
import { applyVarWrites, hasVarChanges } from "@/lib/vars/persist";

function row(key: string, value: string, enabled = true): VariableRow {
	return { id: `id-${key}`, key, value, enabled };
}

describe("applyVarWrites", () => {
	test("updates the value of an existing enabled row", () => {
		const out = applyVarWrites([row("a", "1")], { a: "2" });
		expect(out).toEqual([{ id: "id-a", key: "a", value: "2", enabled: true }]);
	});

	test("appends keys with no matching row", () => {
		const out = applyVarWrites([row("a", "1")], { a: "1", b: "9" });
		expect(out).toHaveLength(2);
		expect(out[1]).toMatchObject({ key: "b", value: "9", enabled: true });
		expect(out[1].id).toBeString();
	});

	test("drops an enabled row whose key was unset", () => {
		const out = applyVarWrites([row("a", "1"), row("b", "2")], { a: "1" });
		expect(out).toEqual([{ id: "id-a", key: "a", value: "1", enabled: true }]);
	});

	test("leaves disabled rows untouched and does not treat them as the source of truth", () => {
		const out = applyVarWrites([row("a", "1", false)], { a: "2" });
		expect(out).toEqual([
			{ id: "id-a", key: "a", value: "1", enabled: false },
			expect.objectContaining({ key: "a", value: "2", enabled: true }),
		]);
	});
});

describe("hasVarChanges", () => {
	test("false when the enabled projection equals final", () => {
		expect(hasVarChanges([row("a", "1"), row("b", "2", false)], { a: "1" })).toBe(false);
	});

	test("true on a changed value", () => {
		expect(hasVarChanges([row("a", "1")], { a: "2" })).toBe(true);
	});

	test("true on an added key", () => {
		expect(hasVarChanges([row("a", "1")], { a: "1", b: "2" })).toBe(true);
	});

	test("true on a removed key", () => {
		expect(hasVarChanges([row("a", "1"), row("b", "2")], { a: "1" })).toBe(true);
	});
});
