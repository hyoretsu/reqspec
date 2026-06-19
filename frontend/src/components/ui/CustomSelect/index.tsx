import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CustomSelectProps } from "./types";

interface Position {
	top: number;
	left: number;
	width: number;
}

/**
 * Button-triggered select with a portal-based popover (position: fixed) so it escapes
 * overflow: hidden/auto containers like modals. No native <select>.
 */
export function CustomSelect<T extends string>({
	value,
	options,
	onChange,
	placeholder = "Select…",
	className,
	"aria-label": ariaLabel,
}: CustomSelectProps<T>) {
	const [open, setOpen] = useState(false);
	const [position, setPosition] = useState<Position | null>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);

	const selected = options.find(option => option.value === value);

	const reposition = () => {
		const trigger = triggerRef.current;
		if (!trigger) return;
		const rect = trigger.getBoundingClientRect();
		setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
	};

	useLayoutEffect(() => {
		if (open) reposition();
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onScrollOrResize = () => reposition();
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
				setOpen(false);
			}
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		window.addEventListener("scroll", onScrollOrResize, true);
		window.addEventListener("resize", onScrollOrResize);
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("scroll", onScrollOrResize, true);
			window.removeEventListener("resize", onScrollOrResize);
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<>
			<button
				ref={triggerRef}
				type="button"
				aria-label={ariaLabel}
				aria-haspopup="listbox"
				aria-expanded={open}
				onClick={() => setOpen(prev => !prev)}
				className={clsx(
					"inline-flex h-10 items-center justify-between gap-2 rounded-md border border-border bg-surface-raised px-3 text-sm text-fg transition-colors hover:border-primary",
					className,
				)}
			>
				<span className="flex items-center gap-2 truncate">
					{selected ? (selected.adornment ?? selected.label) : <span className="text-muted">{placeholder}</span>}
				</span>
				<span aria-hidden className="text-muted">
					▾
				</span>
			</button>

			{open && position
				? createPortal(
						<div
							ref={popoverRef}
							role="listbox"
							style={{ position: "fixed", top: position.top, left: position.left, minWidth: position.width }}
							className="z-50 max-h-72 overflow-auto rounded-md border border-border bg-surface-raised p-1 shadow-lg"
						>
							{options.map(option => (
								<button
									key={option.value}
									type="button"
									role="option"
									aria-selected={option.value === value}
									onClick={() => {
										onChange(option.value);
										setOpen(false);
									}}
									className={clsx(
										"flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface",
										option.value === value ? "text-fg" : "text-muted",
									)}
								>
									{option.adornment ?? option.label}
								</button>
							))}
						</div>,
						document.body,
					)
				: null}
		</>
	);
}
