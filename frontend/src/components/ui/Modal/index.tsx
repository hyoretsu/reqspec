import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
	title: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
}

/** Base themed modal: portal overlay + centered card. Esc and backdrop click close it. */
export function Modal({ title, onClose, children, footer }: ModalProps) {
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			onClick={onClose}
			role="presentation"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={title}
				onClick={event => event.stopPropagation()}
				className="w-full max-w-md rounded-card border border-border bg-surface-raised p-4 shadow-xl"
			>
				<h2 className="mb-3 text-base font-semibold text-fg">{title}</h2>
				<div className="text-sm text-fg">{children}</div>
				{footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
			</div>
		</div>,
		document.body,
	);
}
