import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { PromptRequest } from "@/lib/store/modal.store";

interface PromptModalProps {
	request: PromptRequest;
	onResolve: (value: string | null) => void;
}

export function PromptModal({ request, onResolve }: PromptModalProps) {
	const [value, setValue] = useState(request.defaultValue);

	return (
		<Modal
			title={request.title}
			onClose={() => onResolve(null)}
			footer={
				<>
					<Button variant="secondary" onClick={() => onResolve(null)}>
						{request.cancelLabel}
					</Button>
					<Button onClick={() => onResolve(value)}>{request.confirmLabel}</Button>
				</>
			}
		>
			{request.message ? <p className="mb-2 text-muted">{request.message}</p> : null}
			{/* Local state only — safe to use a raw debounced-free input inside a transient modal. */}
			<input
				autoFocus
				value={value}
				placeholder={request.placeholder}
				onChange={event => setValue(event.target.value)}
				onKeyDown={event => {
					if (event.key === "Enter") onResolve(value);
				}}
				className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-primary"
			/>
		</Modal>
	);
}
