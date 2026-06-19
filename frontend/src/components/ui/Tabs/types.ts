import type { ReactNode } from "react";

export interface TabItem<T extends string> {
	id: T;
	label: string;
	/** Optional trailing count/dot badge. */
	badge?: ReactNode;
}

export interface TabsProps<T extends string> {
	tabs: TabItem<T>[];
	value: T;
	onChange: (value: T) => void;
	className?: string;
}
