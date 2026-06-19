import { CustomSelect, Textarea, type SelectOption } from "@/components/ui";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import type { BodyDescriptor } from "@/lib/request/model";

type RawBody = Extract<BodyDescriptor, { type: "raw" }>;
type Subtype = RawBody["subtype"];

const SUBTYPE_OPTIONS: SelectOption<Subtype>[] = [
	{ label: "JSON", value: "json" },
	{ label: "Text", value: "text" },
];

export function RawBodyEditor({ body }: { body: RawBody }) {
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	return (
		<div className="flex flex-col gap-2">
			<CustomSelect
				aria-label="Raw body type"
				value={body.subtype}
				options={SUBTYPE_OPTIONS}
				onChange={subtype => patchDraft({ body: { ...body, subtype } })}
				className="w-32"
			/>
			<Textarea
				value={body.content}
				onChange={content => patchDraft({ body: { ...body, content } })}
				placeholder={body.subtype === "json" ? '{\n  "key": "value"\n}' : "Raw request body"}
				rows={10}
			/>
		</div>
	);
}
