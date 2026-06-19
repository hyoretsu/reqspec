import { KeyValueEditor } from "@/components/ui";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import type { BodyDescriptor, KeyValue } from "@/lib/request/model";

type FieldsBody = Extract<BodyDescriptor, { type: "form-data" | "urlencoded" }>;

/** Shared editor for the two field-based body types (form-data, urlencoded). */
export function FieldsBodyEditor({ body }: { body: FieldsBody }) {
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	const onChange = (fields: KeyValue[]) => patchDraft({ body: { ...body, fields } });

	return <KeyValueEditor items={body.fields} onChange={onChange} keyPlaceholder="field" valuePlaceholder="value" />;
}
