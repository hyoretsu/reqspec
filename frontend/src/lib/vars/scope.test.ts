import { describe, expect, it } from "bun:test";
import { buildScope, type Variable } from "@/lib/vars/scope";

function v(key: string, value: string, enabled = true): Variable {
	return { key, value, enabled };
}

describe("buildScope", () => {
	it("includes only enabled, non-empty-keyed variables", () => {
		const scope = buildScope([v("a", "1"), v("b", "2", false), v("", "3")], undefined);
		expect(scope.env).toEqual({ a: "1" });
		expect(scope.globals).toEqual({});
	});

	it("separates env and global maps", () => {
		const scope = buildScope([v("host", "env")], [v("host", "glob"), v("only", "g")]);
		expect(scope.env).toEqual({ host: "env" });
		expect(scope.globals).toEqual({ host: "glob", only: "g" });
	});

	it("handles undefined inputs", () => {
		expect(buildScope(undefined, undefined)).toEqual({ env: {}, globals: {} });
	});
});
