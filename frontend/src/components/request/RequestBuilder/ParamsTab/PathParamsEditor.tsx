import { Input } from "@/components/ui";
import { reconcilePathParams } from "@/lib/request/url";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

/**
 * Always-visible editor for path-param values. Rows are derived from the `:tokens` in the
 * URL (keys are read-only); only the value is editable, and values persist across token
 * edits via {@link reconcilePathParams}.
 */
export function PathParamsEditor() {
	const url = useActiveRequestStore(state => state.draft.url);
	const stored = useActiveRequestStore(state => state.draft.pathParams);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	const rows = reconcilePathParams(url, stored ?? []);

	const setValue = (name: string, value: string) =>
		patchDraft({ pathParams: rows.map(row => (row.key === name ? { ...row, value } : row)) });

	if (rows.length === 0) {
		return (
			<p className="text-xs text-muted">
				Declare a path param with <code className="text-fg">:name</code> in the URL — e.g.{" "}
				<code className="text-fg">/users/:id</code>.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{rows.map(row => (
				<div key={row.id} className="flex items-center gap-2">
					<span className="w-44 shrink-0 truncate rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-muted">
						:{row.key}
					</span>
					<Input
						value={row.value}
						onChange={value => setValue(row.key, value)}
						placeholder={row.key}
						className="h-9"
					/>
				</div>
			))}
		</div>
	);
}
