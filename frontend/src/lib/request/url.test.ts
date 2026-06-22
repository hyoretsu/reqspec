import { describe, expect, it } from "bun:test";
import { createKeyValue } from "@/lib/request/model";
import {
	applyPathParams,
	barRoundTrips,
	composeUrl,
	extractPathParams,
	mergeQueryParams,
	reconcilePathParams,
	splitUrl,
} from "@/lib/request/url";

describe("splitUrl", () => {
	it("returns the whole string as base when there is no query", () => {
		expect(splitUrl("https://x.com/a")).toEqual({ base: "https://x.com/a", params: [] });
	});

	it("parses query pairs and decodes values", () => {
		const { base, params } = splitUrl("https://x.com/a?q=hi%20there&n=1");
		expect(base).toBe("https://x.com/a");
		expect(params.map(p => [p.key, p.value])).toEqual([
			["q", "hi there"],
			["n", "1"],
		]);
		expect(params.every(p => p.enabled)).toBe(true);
	});

	it("handles a flag param with no '=' and skips empty pairs", () => {
		const { params } = splitUrl("https://x.com/a?flag&&n=2");
		expect(params.map(p => [p.key, p.value])).toEqual([
			["flag", ""],
			["n", "2"],
		]);
	});

	it("leaves malformed encoding untouched", () => {
		const { params } = splitUrl("https://x.com/a?q=%E0%A4%A");
		expect(params[0].value).toBe("%E0%A4%A");
	});
});

describe("composeUrl", () => {
	it("returns the base when there are no active params", () => {
		expect(composeUrl("https://x.com/a", [])).toBe("https://x.com/a");
	});

	it("mounts enabled, non-empty-key params raw", () => {
		const params = [createKeyValue({ key: "q", value: "hi there" }), createKeyValue({ key: "n", value: "1" })];
		expect(composeUrl("https://x.com/a", params)).toBe("https://x.com/a?q=hi there&n=1");
	});

	it("omits disabled and empty-key params, and drops '=' for empty values", () => {
		const params = [
			createKeyValue({ key: "on", value: "" }),
			createKeyValue({ key: "off", value: "x", enabled: false }),
			createKeyValue({ key: "", value: "y" }),
		];
		expect(composeUrl("https://x.com/a", params)).toBe("https://x.com/a?on");
	});

	it("uses & when the base already has a query", () => {
		expect(composeUrl("https://x.com/a?z=1", [createKeyValue({ key: "q", value: "2" })])).toBe(
			"https://x.com/a?z=1&q=2",
		);
	});
});

describe("mergeQueryParams", () => {
	it("keeps the parsed params and re-appends disabled rows from the table", () => {
		const parsed = [createKeyValue({ key: "q", value: "1" })];
		const existing = [
			createKeyValue({ key: "q", value: "old" }),
			createKeyValue({ key: "hidden", value: "h", enabled: false }),
		];
		const merged = mergeQueryParams(parsed, existing);
		expect(merged.map(p => [p.key, p.value, p.enabled])).toEqual([
			["q", "1", true],
			["hidden", "h", false],
		]);
	});
});

describe("barRoundTrips", () => {
	it("is true when there are no active params", () => {
		expect(barRoundTrips("https://x.com/a?legacy=1", [])).toBe(true);
	});

	it("is true for representable values (including a literal '=')", () => {
		const params = [createKeyValue({ key: "q", value: "hi there" }), createKeyValue({ key: "f", value: "a=b" })];
		expect(barRoundTrips("https://x.com/a", params)).toBe(true);
	});

	it("is false when a value contains a literal '&' (would re-parse as a separator)", () => {
		const params = [createKeyValue({ key: "q", value: "a&b" })];
		expect(barRoundTrips("https://x.com/a", params)).toBe(false);
	});

	it("ignores disabled rows", () => {
		const params = [
			createKeyValue({ key: "q", value: "1" }),
			createKeyValue({ key: "x", value: "a&b", enabled: false }),
		];
		expect(barRoundTrips("https://x.com/a", params)).toBe(true);
	});

	it("is false when the base already carries its own query", () => {
		const params = [createKeyValue({ key: "q", value: "2" })];
		expect(barRoundTrips("https://x.com/a?z=1", params)).toBe(false);
	});
});

describe("extractPathParams", () => {
	it("collects :tokens in order, de-duplicated, ignoring scheme and port", () => {
		expect(extractPathParams("https://x.com:8080/a/:id/b/:id/c/:slug")).toEqual(["id", "slug"]);
	});

	it("returns empty when there are no tokens", () => {
		expect(extractPathParams("https://x.com/a")).toEqual([]);
	});
});

describe("reconcilePathParams", () => {
	it("keeps stored values for surviving tokens and drops stale ones", () => {
		const stored = [createKeyValue({ key: "id", value: "42" }), createKeyValue({ key: "gone", value: "x" })];
		const rows = reconcilePathParams("https://x.com/:id/:slug", stored);
		expect(rows.map(r => [r.key, r.value])).toEqual([
			["id", "42"],
			["slug", ""],
		]);
	});
});

describe("applyPathParams", () => {
	it("substitutes enabled, non-empty values and encodes them", () => {
		const params = [createKeyValue({ key: "id", value: "a b" })];
		expect(applyPathParams("https://x.com/:id", params)).toBe("https://x.com/a%20b");
	});

	it("leaves tokens intact when unset or disabled", () => {
		const params = [
			createKeyValue({ key: "id", value: "" }),
			createKeyValue({ key: "slug", value: "x", enabled: false }),
		];
		expect(applyPathParams("https://x.com/:id/:slug/:missing", params)).toBe("https://x.com/:id/:slug/:missing");
	});
});
