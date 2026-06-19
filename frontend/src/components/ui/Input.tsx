import clsx from "clsx";
import { type InputHTMLAttributes, forwardRef } from "react";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
	value: string;
	onChange: (value: string) => void;
	/** Debounce delay for the parent onChange (ms). */
	delay?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ value, onChange, delay, className, onBlur, ...props },
	ref,
) {
	const debounced = useDebouncedInput({ value, onChange, delay });

	return (
		<input
			ref={ref}
			value={debounced.value}
			onChange={event => debounced.onChange(event.target.value)}
			onBlur={event => {
				debounced.flush();
				onBlur?.(event);
			}}
			className={clsx(
				"h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-primary",
				className,
			)}
			{...props}
		/>
	);
});
