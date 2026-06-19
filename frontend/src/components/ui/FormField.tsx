import clsx from "clsx";
import type { ReactNode } from "react";

interface FormFieldProps {
	label: string;
	error?: string;
	/** Set true when the control is not a real form element (e.g. a button-based select). */
	standalone?: boolean;
	className?: string;
	children: ReactNode;
}

export function FormField({ label, error, standalone, className, children }: FormFieldProps) {
	const Wrapper = standalone ? "div" : "label";
	return (
		<Wrapper className={clsx("flex flex-col gap-1.5", className)}>
			<span className="text-xs font-medium text-muted">{label}</span>
			{children}
			{error ? <span className="text-xs text-danger">{error}</span> : null}
		</Wrapper>
	);
}
