import clsx from "clsx";
import { type TextareaHTMLAttributes, forwardRef } from "react";
import { useDebouncedInput } from "@/hooks/use-debounced-input";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
	value: string;
	onChange: (value: string) => void;
	delay?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
	{ value, onChange, delay, className, onBlur, ...props },
	ref,
) {
	const debounced = useDebouncedInput({ value, onChange, delay });

	return (
		<textarea
			ref={ref}
			value={debounced.value}
			onChange={event => debounced.onChange(event.target.value)}
			onBlur={event => {
				debounced.flush();
				onBlur?.(event);
			}}
			className={clsx(
				"w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-primary",
				className,
			)}
			{...props}
		/>
	);
});
