import { KeyValueEditor } from "@/components/ui";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

export function ParamsTab() {
	const params = useActiveRequestStore(state => state.draft.params);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	return (
		<KeyValueEditor
			items={params}
			onChange={next => patchDraft({ params: next })}
			keyPlaceholder="param"
			valuePlaceholder="value"
		/>
	);
}
