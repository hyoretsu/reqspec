/**
 * Collection-runner data files: parse CSV/JSON into per-iteration rows.
 * Each row becomes the `data` variable layer for one iteration.
 * Pure module — no I/O; the caller reads the file text and picks the type.
 */

export type DataFileType = "csv" | "json";

/** A single iteration's data: every value is coerced to a string (the var scope is string-typed). */
export type DataRow = Record<string, string>;

/** Infer the data-file type from a filename extension, if recognizable. */
export function detectDataFileType(filename: string): DataFileType | undefined {
	const lower = filename.toLowerCase();
	if (lower.endsWith(".csv")) return "csv";
	if (lower.endsWith(".json")) return "json";
	return undefined;
}

/** Parse a data file of the given type into rows. Throws on malformed input. */
export function parseDataFile(content: string, type: DataFileType): DataRow[] {
	return type === "csv" ? parseCsv(content) : parseJsonData(content);
}

/**
 * Parse RFC 4180-ish CSV: the first row is the header, quoted fields may contain
 * commas/newlines, and `""` is an escaped quote. Empty input yields no rows.
 */
export function parseCsv(content: string): DataRow[] {
	const records = tokenizeCsv(content);
	if (records.length === 0) return [];

	const [header, ...rows] = records;
	return (
		rows
			// A trailing newline produces one empty record; drop blank lines.
			.filter((cells) => !(cells.length === 1 && cells[0] === ""))
			.map((cells) => {
				const row: DataRow = {};
				header.forEach((key, i) => {
					row[key] = cells[i] ?? "";
				});
				return row;
			})
	);
}

/** Split CSV text into records of cells, honoring quotes and escaped quotes. */
function tokenizeCsv(content: string): string[][] {
	const records: string[][] = [];
	let cells: string[] = [];
	let field = "";
	let inQuotes = false;
	let started = false;

	const pushField = () => {
		cells.push(field);
		field = "";
	};
	const pushRecord = () => {
		pushField();
		records.push(cells);
		cells = [];
		started = false;
	};

	for (let i = 0; i < content.length; i++) {
		const char = content[i];
		started = true;
		if (inQuotes) {
			if (char === '"') {
				if (content[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += char;
			}
			continue;
		}
		if (char === '"') {
			inQuotes = true;
		} else if (char === ",") {
			pushField();
		} else if (char === "\n") {
			pushRecord();
		} else if (char === "\r") {
			// Swallow CR; the following LF (if any) terminates the record.
			if (content[i + 1] === "\n") continue;
			pushRecord();
		} else {
			field += char;
		}
	}
	if (started || field !== "" || cells.length > 0) pushRecord();
	return records;
}

/** Parse a JSON array of objects into rows; every value is stringified. */
export function parseJsonData(content: string): DataRow[] {
	const parsed = JSON.parse(content);
	if (!Array.isArray(parsed))
		throw new Error("Data file must be a JSON array of objects");
	return parsed.map((entry, i) => {
		if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
			throw new Error(`Data row ${i} must be an object`);
		}
		const row: DataRow = {};
		for (const [key, value] of Object.entries(
			entry as Record<string, unknown>,
		)) {
			row[key] = value === null || value === undefined ? "" : String(value);
		}
		return row;
	});
}
