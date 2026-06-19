import type { ReactNode } from "react";

export interface SelectOption<T extends string> {
	label: string;
	value: T;
	/** Optional leading adornment (e.g. a colored method label). */
	adornment?: ReactNode;
}

export interface CustomSelectProps<T extends string> {
	value: T;
	options: SelectOption<T>[];
	onChange: (value: T) => void;
	placeholder?: string;
	className?: string;
	"aria-label"?: string;
}
