import { FormField, Input } from "@/components/ui";
import type { AuthDescriptor } from "@/lib/request/model";

type BearerAuth = Extract<AuthDescriptor, { type: "bearer" }>;

export function BearerAuthForm({ auth, onChange }: { auth: BearerAuth; onChange: (a: BearerAuth) => void }) {
	return (
		<FormField label="Token">
			<Input
				value={auth.token}
				onChange={token => onChange({ ...auth, token })}
				placeholder="{{token}} or a literal value"
			/>
		</FormField>
	);
}
