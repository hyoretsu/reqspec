import clsx from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	label: string;
}

/**
 * Icon-only toolbar button — the only sanctioned borderless button. The icon itself
 * communicates interactivity; a clear hover background reinforces it.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
	{ label, className, type = "button", children, ...props },
	ref,
) {
	return (
		<button
			ref={ref}
			type={type}
			aria-label={label}
			title={label}
			className={clsx(
				"inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-fg disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
});
