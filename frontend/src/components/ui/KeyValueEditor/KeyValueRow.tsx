import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import type { KeyValueRowProps } from "./types";

export function KeyValueRow({
	item,
	keyPlaceholder,
	valuePlaceholder,
	allowSecret,
	onChange,
	onRemove,
}: KeyValueRowProps) {
	const [revealed, setRevealed] = useState(false);
	const masked = allowSecret && item.secret && !revealed;

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
				type={masked ? "password" : "text"}
				className="h-9"
			/>
			{allowSecret ? (
				<>
					<IconButton
						label={item.secret ? "Mark as not secret" : "Mark as secret"}
						onClick={() => onChange({ ...item, secret: !item.secret })}
						className={item.secret ? "text-primary" : ""}
					>
						{item.secret ? "🔒" : "🔓"}
					</IconButton>
					{item.secret ? (
						<IconButton label={revealed ? "Hide value" : "Reveal value"} onClick={() => setRevealed(p => !p)}>
							{revealed ? "🙈" : "👁"}
						</IconButton>
					) : null}
				</>
			) : null}
			<IconButton label="Remove row" onClick={onRemove}>
				✕
			</IconButton>
		</div>
	);
}
