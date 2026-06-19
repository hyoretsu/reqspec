import type { ReactNode } from "react";

interface EmptyStateProps {
	title: string;
	description?: string;
	action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
			<p className="text-sm font-medium text-fg">{title}</p>
			{description ? <p className="max-w-xs text-xs text-muted">{description}</p> : null}
			{action ? <div className="mt-2">{action}</div> : null}
		</div>
	);
}
