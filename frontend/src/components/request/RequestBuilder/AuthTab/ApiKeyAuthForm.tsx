import { CustomSelect, FormField, Input, type SelectOption } from "@/components/ui";
import type { AuthDescriptor } from "@/lib/request/model";

type ApiKeyAuth = Extract<AuthDescriptor, { type: "apikey" }>;

const ADD_TO: SelectOption<ApiKeyAuth["addTo"]>[] = [
	{ label: "Header", value: "header" },
	{ label: "Query param", value: "query" },
];

export function ApiKeyAuthForm({ auth, onChange }: { auth: ApiKeyAuth; onChange: (a: ApiKeyAuth) => void }) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-3 sm:flex-row">
				<FormField label="Key" className="flex-1">
					<Input value={auth.key} onChange={key => onChange({ ...auth, key })} placeholder="X-API-Key" />
				</FormField>
				<FormField label="Value" className="flex-1">
					<Input value={auth.value} onChange={value => onChange({ ...auth, value })} placeholder="{{apiKey}}" />
				</FormField>
			</div>
			<FormField label="Add to" standalone>
				<CustomSelect
					aria-label="Add API key to"
					value={auth.addTo}
					options={ADD_TO}
					onChange={addTo => onChange({ ...auth, addTo })}
					className="w-40"
				/>
			</FormField>
		</div>
	);
}
