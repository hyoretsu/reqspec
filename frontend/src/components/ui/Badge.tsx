import clsx from "clsx";
import type { HttpMethod } from "@/lib/request/model";

const METHOD_COLOR: Record<HttpMethod, string> = {
	GET: "text-method-get",
	POST: "text-method-post",
	PUT: "text-method-put",
	PATCH: "text-method-patch",
	DELETE: "text-method-delete",
	HEAD: "text-method-head",
	OPTIONS: "text-method-options",
};

export function MethodBadge({ method, className }: { method: HttpMethod; className?: string }) {
	return (
		<span className={clsx("font-mono text-xs font-bold uppercase", METHOD_COLOR[method], className)}>
			{method}
		</span>
	);
}

function statusColor(status: number): string {
	if (status === 0) return "text-danger";
	if (status < 300) return "text-success";
	if (status < 400) return "text-method-head";
	if (status < 500) return "text-warning";
	return "text-danger";
}

export function StatusBadge({ status, statusText }: { status: number; statusText: string }) {
	return (
		<span className={clsx("font-mono text-sm font-semibold", statusColor(status))}>
			{status === 0 ? "Failed" : `${status} ${statusText}`.trim()}
		</span>
	);
}
