import { KeyValueEditor } from "@/components/ui";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

export function HeadersTab() {
	const headers = useActiveRequestStore(state => state.draft.headers);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	return (
		<KeyValueEditor
			items={headers}
			onChange={next => patchDraft({ headers: next })}
			keyPlaceholder="Header"
			valuePlaceholder="Value"
		/>
	);
}
