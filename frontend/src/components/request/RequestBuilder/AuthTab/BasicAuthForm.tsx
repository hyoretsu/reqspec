import { FormField, Input } from "@/components/ui";
import type { AuthDescriptor } from "@/lib/request/model";

type BasicAuth = Extract<AuthDescriptor, { type: "basic" }>;

export function BasicAuthForm({ auth, onChange }: { auth: BasicAuth; onChange: (a: BasicAuth) => void }) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row">
			<FormField label="Username" className="flex-1">
				<Input value={auth.username} onChange={username => onChange({ ...auth, username })} placeholder="user" />
			</FormField>
			<FormField label="Password" className="flex-1">
				<Input
					type="password"
					value={auth.password}
					onChange={password => onChange({ ...auth, password })}
					placeholder="••••••"
				/>
			</FormField>
		</div>
	);
}
