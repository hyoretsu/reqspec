import { CustomSelect, type SelectOption } from "@/components/ui";
import { FieldsBodyEditor } from "@/components/request/RequestBuilder/BodyTab/FieldsBodyEditor";
import { GraphQLBodyEditor } from "@/components/request/RequestBuilder/BodyTab/GraphQLBodyEditor";
import { RawBodyEditor } from "@/components/request/RequestBuilder/BodyTab/RawBodyEditor";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import type { BodyDescriptor } from "@/lib/request/model";

type BodyType = BodyDescriptor["type"];

const BODY_OPTIONS: SelectOption<BodyType>[] = [
	{ label: "None", value: "none" },
	{ label: "Raw", value: "raw" },
	{ label: "Form Data", value: "form-data" },
	{ label: "URL Encoded", value: "urlencoded" },
	{ label: "GraphQL", value: "graphql" },
];

function defaultBody(type: BodyType): BodyDescriptor {
	switch (type) {
		case "raw":
			return { type: "raw", subtype: "json", content: "" };
		case "form-data":
			return { type: "form-data", fields: [] };
		case "urlencoded":
			return { type: "urlencoded", fields: [] };
		case "graphql":
			return { type: "graphql", query: "", variables: "" };
		default:
			return { type: "none" };
	}
}

export function BodyTab() {
	const body = useActiveRequestStore(state => state.draft.body);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	return (
		<div className="flex flex-col gap-3">
			<CustomSelect
				aria-label="Body type"
				value={body.type}
				options={BODY_OPTIONS}
				onChange={type => patchDraft({ body: defaultBody(type) })}
				className="w-40"
			/>

			{body.type === "raw" ? <RawBodyEditor body={body} /> : null}
			{body.type === "form-data" || body.type === "urlencoded" ? <FieldsBodyEditor body={body} /> : null}
			{body.type === "graphql" ? <GraphQLBodyEditor body={body} /> : null}
			{body.type === "none" ? <p className="text-xs text-muted">This request has no body.</p> : null}
		</div>
	);
}
