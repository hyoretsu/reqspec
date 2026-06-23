import { useState } from "react";
import {
	Button,
	CustomSelect,
	type SelectOption,
	Textarea,
} from "@/components/ui";
import { validateOutgoing } from "@/lib/protocols/websocket";
import type { WebSocketConfig } from "@/lib/request/model";

const FORMAT_OPTIONS: SelectOption<WebSocketConfig["messageFormat"]>[] = [
	{ label: "Text", value: "text" },
	{ label: "JSON", value: "json" },
];

interface MessageComposerProps {
	draft: string;
	format: WebSocketConfig["messageFormat"];
	canSend: boolean;
	onDraft: (value: string) => void;
	onFormat: (value: WebSocketConfig["messageFormat"]) => void;
	onSend: (payload: string) => void;
}

/** Outgoing-message editor: format picker + payload textarea + validated Send. */
export function MessageComposer({
	draft,
	format,
	canSend,
	onDraft,
	onFormat,
	onSend,
}: MessageComposerProps) {
	const [error, setError] = useState<string | null>(null);

	const submit = () => {
		const result = validateOutgoing(draft, format);
		if (!result.ok) return setError(result.error);
		setError(null);
		onSend(result.value);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-muted">Compose</span>
				<div className="w-28">
					<CustomSelect
						aria-label="Message format"
						value={format}
						options={FORMAT_OPTIONS}
						onChange={onFormat}
					/>
				</div>
			</div>
			<Textarea
				value={draft}
				onChange={onDraft}
				rows={3}
				placeholder={
					format === "json" ? '{ "event": "ping" }' : "Message to send"
				}
			/>
			{error ? <p className="text-xs text-danger">{error}</p> : null}
			<div className="flex justify-end">
				<Button onClick={submit} disabled={!canSend || draft.trim() === ""}>
					Send
				</Button>
			</div>
		</div>
	);
}
