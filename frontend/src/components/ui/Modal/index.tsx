import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
	title: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
	/** Card width. Defaults to `md`. */
	size?: "md" | "lg" | "xl";
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
	lg: "max-w-2xl",
	md: "max-w-md",
	xl: "max-w-4xl",
};

/** Base themed modal: portal overlay + centered card. Esc and backdrop click close it. */
export function Modal({
	title,
	onClose,
	children,
	footer,
	size = "md",
}: ModalProps) {
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
				onClick={(event) => event.stopPropagation()}
				className={`max-h-[85vh] w-full overflow-y-auto rounded-card border border-border bg-surface-raised p-4 shadow-xl ${SIZE_CLASS[size]}`}
			>
				<h2 className="mb-3 text-base font-semibold text-fg">{title}</h2>
				<div className="text-sm text-fg">{children}</div>
				{footer ? (
					<div className="mt-4 flex justify-end gap-2">{footer}</div>
				) : null}
			</div>
		</div>,
		document.body,
	);
}
