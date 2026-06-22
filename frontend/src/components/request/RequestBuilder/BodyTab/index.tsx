import { CustomSelect, type SelectOption } from "@/components/ui";
import { BinaryBodyEditor } from "@/components/request/RequestBuilder/BodyTab/BinaryBodyEditor";
import { FieldsBodyEditor } from "@/components/request/RequestBuilder/BodyTab/FieldsBodyEditor";
import { FormDataEditor } from "@/components/request/RequestBuilder/BodyTab/FormDataEditor";
import { GraphQLBodyEditor } from "@/components/request/RequestBuilder/BodyTab/GraphQLBodyEditor";
import { RawBodyEditor } from "@/components/request/RequestBuilder/BodyTab/RawBodyEditor";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import { type BodyDescriptor, type BodyType, switchVariant } from "@/lib/request/model";

const BODY_OPTIONS: SelectOption<BodyType>[] = [
	{ label: "None", value: "none" },
	{ label: "Raw", value: "raw" },
	{ label: "Form Data", value: "form-data" },
	{ label: "URL Encoded", value: "urlencoded" },
	{ label: "GraphQL", value: "graphql" },
	{ label: "Binary", value: "binary" },
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
		case "binary":
			return { type: "binary", fileId: crypto.randomUUID(), fileName: "", contentType: "" };
		default:
			return { type: "none" };
	}
}

export function BodyTab() {
	const body = useActiveRequestStore(state => state.draft.body);
	const bodyDrafts = useActiveRequestStore(state => state.draft.bodyDrafts);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	const onTypeChange = (type: BodyType) => {
		const { value, drafts } = switchVariant(body, type, bodyDrafts, defaultBody);
		patchDraft({ body: value, bodyDrafts: drafts });
	};

	return (
		<div className="flex flex-col gap-3">
			<CustomSelect
				aria-label="Body type"
				value={body.type}
				options={BODY_OPTIONS}
				onChange={onTypeChange}
				className="w-40"
			/>

			{body.type === "raw" ? <RawBodyEditor body={body} /> : null}
			{body.type === "form-data" ? <FormDataEditor body={body} /> : null}
			{body.type === "urlencoded" ? <FieldsBodyEditor body={body} /> : null}
			{body.type === "graphql" ? <GraphQLBodyEditor body={body} /> : null}
			{body.type === "binary" ? <BinaryBodyEditor body={body} /> : null}
			{body.type === "none" ? <p className="text-xs text-muted">This request has no body.</p> : null}
		</div>
	);
}
