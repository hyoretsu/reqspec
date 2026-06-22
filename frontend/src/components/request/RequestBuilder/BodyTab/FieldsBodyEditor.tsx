import { KeyValueEditor } from "@/components/ui";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import type { BodyDescriptor, KeyValue } from "@/lib/request/model";

type FieldsBody = Extract<BodyDescriptor, { type: "urlencoded" }>;

/** Editor for the urlencoded body type (plain key/value pairs). Form-data has its own
 * editor since its rows can also hold files. */
export function FieldsBodyEditor({ body }: { body: FieldsBody }) {
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	const onChange = (fields: KeyValue[]) => patchDraft({ body: { ...body, fields } });

	return <KeyValueEditor items={body.fields} onChange={onChange} keyPlaceholder="field" valuePlaceholder="value" />;
}
