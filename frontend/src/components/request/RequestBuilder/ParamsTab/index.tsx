import { KeyValueEditor } from "@/components/ui";
import { PathParamsEditor } from "@/components/request/RequestBuilder/ParamsTab/PathParamsEditor";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

export function ParamsTab() {
	const params = useActiveRequestStore(state => state.draft.params);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	return (
		<div className="flex flex-col gap-5">
			<section className="flex flex-col gap-2">
				<h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Query Params</h3>
				<KeyValueEditor
					items={params}
					onChange={next => patchDraft({ params: next })}
					keyPlaceholder="param"
					valuePlaceholder="value"
				/>
			</section>

			<section className="flex flex-col gap-2">
				<h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Path Params</h3>
				<PathParamsEditor />
			</section>
		</div>
	);
}
