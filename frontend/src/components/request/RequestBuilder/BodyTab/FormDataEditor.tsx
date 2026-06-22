import { Button } from "@/components/ui/Button";
import { FormDataRow } from "@/components/request/RequestBuilder/BodyTab/FormDataRow";
import { createKeyValue, type BodyDescriptor, type KeyValue } from "@/lib/request/model";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

type FormDataBody = Extract<BodyDescriptor, { type: "form-data" }>;

/** Form-data editor: each row holds either a text value or a picked file. */
export function FormDataEditor({ body }: { body: FormDataBody }) {
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	const setFields = (fields: KeyValue[]) => patchDraft({ body: { ...body, fields } });

	const update = (id: string, next: KeyValue) =>
		setFields(body.fields.map(field => (field.id === id ? next : field)));
	const remove = (id: string) => setFields(body.fields.filter(field => field.id !== id));
	const add = () => setFields([...body.fields, createKeyValue()]);

	return (
		<div className="flex flex-col gap-2">
			{body.fields.map(field => (
				<FormDataRow
					key={field.id}
					item={field}
					onChange={next => update(field.id, next)}
					onRemove={() => remove(field.id)}
				/>
			))}
			<div>
				<Button variant="secondary" size="sm" onClick={add}>
					+ Add
				</Button>
			</div>
		</div>
	);
}
