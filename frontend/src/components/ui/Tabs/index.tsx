import clsx from "clsx";
import type { TabsProps } from "./types";

export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
	return (
		<div role="tablist" className={clsx("flex gap-1 border-b border-border", className)}>
			{tabs.map(tab => (
				<button
					key={tab.id}
					type="button"
					role="tab"
					aria-selected={tab.id === value}
					onClick={() => onChange(tab.id)}
					className={clsx(
						"-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
						tab.id === value
							? "border-primary text-fg"
							: "border-transparent text-muted hover:text-fg",
					)}
				>
					{tab.label}
					{tab.badge}
				</button>
			))}
		</div>
	);
}
