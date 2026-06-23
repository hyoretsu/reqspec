import { useState } from "react";
import { FormField, Input } from "@/components/ui";
import { detectDataFileType, parseDataFile } from "@/lib/runner";
import type { DataFileState } from "./types";

interface RunConfigFormProps {
	iterations: string;
	onIterations: (value: string) => void;
	delay: string;
	onDelay: (value: string) => void;
	data: DataFileState | null;
	onData: (data: DataFileState | null) => void;
	disabled: boolean;
}

/** Form for run options: iterations, inter-request delay, and an optional data file. */
export function RunConfigForm({
	iterations,
	onIterations,
	delay,
	onDelay,
	data,
	onData,
	disabled,
}: RunConfigFormProps) {
	const [reading, setReading] = useState(false);

	const onFile = async (file: File | undefined) => {
		if (!file) return onData(null);
		const type = detectDataFileType(file.name);
		if (!type)
			return onData({
				filename: file.name,
				rows: [],
				error: "Unsupported file type (use .csv or .json)",
			});
		setReading(true);
		try {
			const rows = parseDataFile(await file.text(), type);
			onData({ filename: file.name, rows });
		} catch (err) {
			onData({
				filename: file.name,
				rows: [],
				error: err instanceof Error ? err.message : String(err),
			});
		} finally {
			setReading(false);
		}
	};

	const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

	return (
		<div className="flex flex-col gap-3">
			<div className="grid grid-cols-2 gap-3">
				<FormField label="Iterations">
					<Input
						value={iterations}
						onChange={(value) => onIterations(digitsOnly(value))}
						inputMode="numeric"
						placeholder={data?.rows.length ? String(data.rows.length) : "1"}
						disabled={disabled}
					/>
				</FormField>
				<FormField label="Delay (ms)">
					<Input
						value={delay}
						onChange={(value) => onDelay(digitsOnly(value))}
						inputMode="numeric"
						placeholder="0"
						disabled={disabled}
					/>
				</FormField>
			</div>

			<div>
				<div className="mb-1 text-xs font-medium text-muted">
					Data file (CSV / JSON)
				</div>
				<input
					type="file"
					accept=".csv,.json,application/json,text/csv"
					disabled={disabled}
					onChange={(event) => onFile(event.currentTarget.files?.[0])}
					className="block w-full text-sm text-fg file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-raised file:px-3 file:py-1.5 file:text-sm file:text-fg hover:file:bg-surface"
				/>
				{reading ? <p className="mt-1 text-xs text-muted">Reading…</p> : null}
				{data?.error ? (
					<p className="mt-1 text-xs text-danger">{data.error}</p>
				) : null}
				{data && !data.error ? (
					<p className="mt-1 text-xs text-muted">
						{data.filename} — {data.rows.length} row
						{data.rows.length === 1 ? "" : "s"}
					</p>
				) : null}
			</div>
		</div>
	);
}
