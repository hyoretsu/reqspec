import { CustomSelect } from "@/components/ui/CustomSelect";
import type { SelectOption } from "@/components/ui/CustomSelect/types";
import {
	DATE_FORMATS,
	type DateFormatId,
	formatDateTime,
	parseDateTimeLocal,
	toDateTimeLocal,
} from "@/lib/format/datetime";

interface DateTimeFieldProps {
	epochMs: number;
	format: DateFormatId;
	onChange: (next: { epochMs: number; format: DateFormatId }) => void;
}

const FORMAT_OPTIONS: SelectOption<DateFormatId>[] = DATE_FORMATS.map(f => ({ label: f.label, value: f.id }));

/** Date/time picker with an output-format specifier (ISO 8601, Unix, …) and a live preview. */
export function DateTimeField({ epochMs, format, onChange }: DateTimeFieldProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex flex-wrap items-center gap-2">
				<input
					type="datetime-local"
					step="1"
					value={toDateTimeLocal(epochMs)}
					onChange={e => {
						const ms = parseDateTimeLocal(e.target.value);
						if (ms !== null) onChange({ epochMs: ms, format });
					}}
					className="h-9 rounded-md border border-border bg-surface-raised px-2 text-sm text-fg outline-none focus:border-primary"
				/>
				<CustomSelect
					aria-label="Date format"
					value={format}
					options={FORMAT_OPTIONS}
					onChange={f => onChange({ epochMs, format: f })}
					className="h-9 w-40"
				/>
			</div>
			<code className="truncate text-[11px] text-muted">→ {formatDateTime(epochMs, format)}</code>
		</div>
	);
}
