import { describe, expect, it } from "bun:test";
import {
	formatDateTime,
	isNumericFormat,
	parseDateTimeLocal,
	toDateTimeLocal,
} from "@/lib/format/datetime";

const EPOCH = Date.parse("2024-01-02T03:04:05.000Z");

describe("formatDateTime", () => {
	it("formats ISO 8601 variants", () => {
		expect(formatDateTime(EPOCH, "iso")).toBe("2024-01-02T03:04:05.000Z");
		expect(formatDateTime(EPOCH, "iso-date")).toBe("2024-01-02");
		expect(formatDateTime(EPOCH, "iso-time")).toBe("03:04:05");
	});

	it("formats Unix seconds and milliseconds", () => {
		expect(formatDateTime(EPOCH, "unix")).toBe(String(Math.floor(EPOCH / 1000)));
		expect(formatDateTime(EPOCH, "unix-ms")).toBe(String(EPOCH));
	});

	it("formats RFC 2822", () => {
		expect(formatDateTime(EPOCH, "rfc2822")).toBe("Tue, 02 Jan 2024 03:04:05 GMT");
	});
});

describe("isNumericFormat", () => {
	it("flags Unix formats as numeric", () => {
		expect(isNumericFormat("unix")).toBe(true);
		expect(isNumericFormat("unix-ms")).toBe(true);
		expect(isNumericFormat("iso")).toBe(false);
	});
});

describe("parse/toDateTimeLocal", () => {
	it("round-trips a datetime-local value", () => {
		const local = toDateTimeLocal(EPOCH);
		expect(local).toBe("2024-01-02T03:04:05");
		expect(parseDateTimeLocal(local)).toBe(EPOCH);
	});

	it("returns null for empty or invalid input", () => {
		expect(parseDateTimeLocal("")).toBeNull();
		expect(parseDateTimeLocal("nope")).toBeNull();
	});
});
