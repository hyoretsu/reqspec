import { CustomSelect, FormField, Input, type SelectOption } from "@/components/ui";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import type { AuthDescriptor } from "@/lib/request/model";

type AuthType = AuthDescriptor["type"];

const AUTH_OPTIONS: SelectOption<AuthType>[] = [
	{ label: "No Auth", value: "none" },
	{ label: "Basic", value: "basic" },
	{ label: "Bearer Token", value: "bearer" },
];

function defaultAuth(type: AuthType): AuthDescriptor {
	if (type === "basic") return { type: "basic", username: "", password: "" };
	if (type === "bearer") return { type: "bearer", token: "" };
	return { type: "none" };
}

export function AuthTab() {
	const auth = useActiveRequestStore(state => state.draft.auth);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	return (
		<div className="flex flex-col gap-3">
			<FormField label="Auth type" standalone>
				<CustomSelect
					aria-label="Auth type"
					value={auth.type}
					options={AUTH_OPTIONS}
					onChange={type => patchDraft({ auth: defaultAuth(type) })}
					className="w-56"
				/>
			</FormField>

			{auth.type === "basic" ? (
				<div className="flex flex-col gap-3 sm:flex-row">
					<FormField label="Username" className="flex-1">
						<Input
							value={auth.username}
							onChange={username => patchDraft({ auth: { ...auth, username } })}
							placeholder="user"
						/>
					</FormField>
					<FormField label="Password" className="flex-1">
						<Input
							type="password"
							value={auth.password}
							onChange={password => patchDraft({ auth: { ...auth, password } })}
							placeholder="••••••"
						/>
					</FormField>
				</div>
			) : null}

			{auth.type === "bearer" ? (
				<FormField label="Token">
					<Input
						value={auth.token}
						onChange={token => patchDraft({ auth: { ...auth, token } })}
						placeholder="{{token}} or a literal value"
					/>
				</FormField>
			) : null}
		</div>
	);
}
