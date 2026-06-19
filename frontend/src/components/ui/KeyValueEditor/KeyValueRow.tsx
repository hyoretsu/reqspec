import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import type { KeyValueRowProps } from "./types";

export function KeyValueRow({ item, keyPlaceholder, valuePlaceholder, onChange, onRemove }: KeyValueRowProps) {
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
				placeholder={keyPlaceholder}
				className="h-9"
			/>
			<Input
				value={item.value}
				onChange={value => onChange({ ...item, value })}
				placeholder={valuePlaceholder}
				className="h-9"
			/>
			<IconButton label="Remove row" onClick={onRemove}>
				✕
			</IconButton>
		</div>
	);
}
