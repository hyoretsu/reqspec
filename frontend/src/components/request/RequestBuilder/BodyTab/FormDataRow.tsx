import { useRef } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { removeFile, setFile } from "@/lib/files/file-store";
import type { KeyValue } from "@/lib/request/model";

interface FormDataRowProps {
	item: KeyValue;
	onChange: (item: KeyValue) => void;
	onRemove: () => void;
}

/** A single form-data field row that can hold either a text value or a picked file. */
export function FormDataRow({ item, onChange, onRemove }: FormDataRowProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isFile = item.kind === "file";

	const toText = () => {
		removeFile(item.id);
		onChange({ ...item, kind: "text", fileName: undefined });
	};

	const toFile = () => onChange({ ...item, kind: "file", value: "" });

	const onPick = (file: File | undefined) => {
		if (!file) return;
		setFile(item.id, file);
		onChange({ ...item, kind: "file", value: "", fileName: file.name });
	};

	return (
		<div className="flex items-center gap-2">
			<input
				type="checkbox"
				checked={item.enabled}
				onChange={event => onChange({ ...item, enabled: event.target.checked })}
				aria-label="Enabled"
				className="h-4 w-4 shrink-0 accent-primary"
			/>
			<Input
				value={item.key}
				onChange={key => onChange({ ...item, key })}
				placeholder="field"
				className="h-9"
			/>

			{isFile ? (
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					className="flex h-9 w-full items-center truncate rounded-md border border-border bg-surface-raised px-3 text-left text-sm text-fg transition-colors hover:border-primary"
					title={item.fileName ?? "Choose a file"}
				>
					<span className={item.fileName ? "text-fg" : "text-muted"}>{item.fileName ?? "Choose a file…"}</span>
				</button>
			) : (
				<Input
					value={item.value}
					onChange={value => onChange({ ...item, value })}
					placeholder="value"
					className="h-9"
				/>
			)}

			<input
				ref={fileInputRef}
				type="file"
				className="hidden"
				onChange={event => onPick(event.target.files?.[0])}
			/>
			<IconButton
				label={isFile ? "Switch to text" : "Switch to file"}
				onClick={isFile ? toText : toFile}
				className={isFile ? "text-primary" : ""}
			>
				{isFile ? "📎" : "Aa"}
			</IconButton>
			<IconButton label="Remove row" onClick={onRemove}>
				✕
			</IconButton>
		</div>
	);
}
