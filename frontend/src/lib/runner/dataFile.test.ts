import { describe, expect, test } from "bun:test";
import {
	detectDataFileType,
	parseCsv,
	parseDataFile,
	parseJsonData,
} from "@/lib/runner/dataFile";

describe("detectDataFileType", () => {
	test("recognizes csv and json by extension, case-insensitive", () => {
		expect(detectDataFileType("data.csv")).toBe("csv");
		expect(detectDataFileType("DATA.JSON")).toBe("json");
	});

	test("returns undefined for unknown extensions", () => {
		expect(detectDataFileType("data.txt")).toBeUndefined();
		expect(detectDataFileType("data")).toBeUndefined();
	});
});

describe("parseCsv", () => {
	test("parses header + rows into keyed objects", () => {
		const rows = parseCsv("name,age\nAlice,30\nBob,25");
		expect(rows).toEqual([
			{ name: "Alice", age: "30" },
			{ name: "Bob", age: "25" },
		]);
	});

	test("returns no rows for empty input", () => {
		expect(parseCsv("")).toEqual([]);
	});

	test("handles a header-only file", () => {
		expect(parseCsv("name,age")).toEqual([]);
	});

	test("honors quoted fields with commas, newlines, and escaped quotes", () => {
		const rows = parseCsv(
			'name,note\n"Doe, John","line1\nline2"\n"a""b",plain',
		);
		expect(rows).toEqual([
			{ name: "Doe, John", note: "line1\nline2" },
			{ name: 'a"b', note: "plain" },
		]);
	});

	test("supports CRLF line endings and a trailing newline", () => {
		const rows = parseCsv("a,b\r\n1,2\r\n");
		expect(rows).toEqual([{ a: "1", b: "2" }]);
	});

	test("supports lone CR line endings", () => {
		const rows = parseCsv("a,b\r1,2");
		expect(rows).toEqual([{ a: "1", b: "2" }]);
	});

	test("fills missing trailing cells with empty strings", () => {
		const rows = parseCsv("a,b,c\n1,2");
		expect(rows).toEqual([{ a: "1", b: "2", c: "" }]);
	});
});

describe("parseJsonData", () => {
	test("parses an array of objects, stringifying values", () => {
		const rows = parseJsonData('[{"a":1,"b":true,"c":null},{"a":"x"}]');
		expect(rows).toEqual([{ a: "1", b: "true", c: "" }, { a: "x" }]);
	});

	test("throws when the top level is not an array", () => {
		expect(() => parseJsonData('{"a":1}')).toThrow("must be a JSON array");
	});

	test("throws when a row is not an object", () => {
		expect(() => parseJsonData("[1]")).toThrow("row 0 must be an object");
		expect(() => parseJsonData("[[1]]")).toThrow("row 0 must be an object");
		expect(() => parseJsonData("[null]")).toThrow("row 0 must be an object");
	});
});

describe("parseDataFile", () => {
	test("dispatches by type", () => {
		expect(parseDataFile("a\n1", "csv")).toEqual([{ a: "1" }]);
		expect(parseDataFile('[{"a":1}]', "json")).toEqual([{ a: "1" }]);
	});
});
