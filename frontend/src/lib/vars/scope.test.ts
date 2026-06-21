import { describe, expect, it } from "bun:test";
import { buildScope, type Variable } from "@/lib/vars/scope";

function v(key: string, value: string, enabled = true): Variable {
	return { key, value, enabled };
}

describe("buildScope", () => {
	it("includes only enabled, non-empty-keyed variables", () => {
		const scope = buildScope({ environment: [v("a", "1"), v("b", "2", false), v("", "3")] });
		expect(scope.environment).toEqual({ a: "1" });
		expect(scope.globals).toEqual({});
	});

	it("separates the layers", () => {
		const scope = buildScope({
			environment: [v("host", "env")],
			collection: [v("host", "col"), v("base", "c")],
			globals: [v("only", "g")],
		});
		expect(scope.environment).toEqual({ host: "env" });
		expect(scope.collection).toEqual({ host: "col", base: "c" });
		expect(scope.globals).toEqual({ only: "g" });
	});

	it("handles an empty layer set", () => {
		expect(buildScope({})).toEqual({ local: {}, data: {}, environment: {}, collection: {}, globals: {} });
	});
});
