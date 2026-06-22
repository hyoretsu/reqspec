export type DateFormatId = "iso" | "iso-date" | "iso-time" | "unix" | "unix-ms" | "rfc2822";

export interface DateFormat {
	id: DateFormatId;
	label: string;
	example: string;
}

export const DATE_FORMATS: DateFormat[] = [
	{ id: "iso", label: "ISO 8601", example: "2024-01-02T03:04:05.000Z" },
	{ id: "iso-date", label: "ISO date", example: "2024-01-02" },
	{ id: "iso-time", label: "ISO time", example: "03:04:05" },
	{ id: "unix", label: "Unix (seconds)", example: "1704164645" },
	{ id: "unix-ms", label: "Unix (ms)", example: "1704164645000" },
	{ id: "rfc2822", label: "RFC 2822", example: "Tue, 02 Jan 2024 03:04:05 GMT" },
];

/** Format an epoch-ms timestamp into the given format. Always UTC for determinism. */
export function formatDateTime(epochMs: number, format: DateFormatId): string {
	const d = new Date(epochMs);
	switch (format) {
		case "iso":
			return d.toISOString();
		case "iso-date":
			return d.toISOString().slice(0, 10);
		case "iso-time":
			return d.toISOString().slice(11, 19);
		case "unix":
			return String(Math.floor(epochMs / 1000));
		case "unix-ms":
			return String(epochMs);
		case "rfc2822":
			return d.toUTCString();
	}
}

/** Whether a formatted value should be emitted as a JSON number (Unix) rather than a string. */
export function isNumericFormat(format: DateFormatId): boolean {
	return format === "unix" || format === "unix-ms";
}

/** Parse a `datetime-local` input value (local time, no zone) into epoch ms. */
export function parseDateTimeLocal(value: string): number | null {
	if (value === "") return null;
	const ms = Date.parse(value);
	return Number.isNaN(ms) ? null : ms;
}

/** Convert epoch ms to a `datetime-local`-compatible string (UTC, second precision). */
export function toDateTimeLocal(epochMs: number): string {
	return new Date(epochMs).toISOString().slice(0, 19);
}
