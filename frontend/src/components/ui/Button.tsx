import clsx from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	size?: Size;
}

const VARIANTS: Record<Variant, string> = {
	primary: "border-primary bg-primary text-primary-fg hover:opacity-90",
	secondary: "border-border bg-surface-raised text-fg hover:bg-surface",
	danger: "border-danger bg-danger text-white hover:opacity-90",
};

const SIZES: Record<Size, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ variant = "primary", size = "md", className, type = "button", ...props },
	ref,
) {
	return (
		<button
			ref={ref}
			type={type}
			className={clsx(
				"inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
				VARIANTS[variant],
				SIZES[size],
				className,
			)}
			{...props}
		/>
	);
});
