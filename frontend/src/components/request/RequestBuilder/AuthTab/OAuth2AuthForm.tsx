import { useState } from "react";
import { Button, CustomSelect, FormField, Input, Spinner, type SelectOption } from "@/components/ui";
import { fetchToken } from "@/lib/auth/oauth2";
import type { AuthDescriptor } from "@/lib/request/model";
import { confirmDialog } from "@/lib/ui/modal";

type OAuth2Auth = Extract<AuthDescriptor, { type: "oauth2" }>;
type Grant = OAuth2Auth["grantType"];

const GRANTS: SelectOption<Grant>[] = [
	{ label: "Client Credentials", value: "client_credentials" },
	{ label: "Password", value: "password" },
	{ label: "Token (paste)", value: "token" },
];

export function OAuth2AuthForm({ auth, onChange }: { auth: OAuth2Auth; onChange: (a: OAuth2Auth) => void }) {
	const [loading, setLoading] = useState(false);

	const getToken = async () => {
		setLoading(true);
		try {
			const accessToken = await fetchToken(auth);
			onChange({ ...auth, accessToken });
		} catch (err) {
			await confirmDialog({
				title: "Token request failed",
				message: err instanceof Error ? err.message : "Unknown error",
				danger: true,
				confirmLabel: "OK",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<FormField label="Grant type" standalone>
				<CustomSelect
					aria-label="OAuth2 grant type"
					value={auth.grantType}
					options={GRANTS}
					onChange={grantType => onChange({ ...auth, grantType })}
					className="w-56"
				/>
			</FormField>

			{auth.grantType !== "token" ? (
				<>
					<FormField label="Token URL">
						<Input
							value={auth.tokenUrl}
							onChange={tokenUrl => onChange({ ...auth, tokenUrl })}
							placeholder="https://auth.example.com/oauth/token"
						/>
					</FormField>
					<div className="flex flex-col gap-3 sm:flex-row">
						<FormField label="Client ID" className="flex-1">
							<Input value={auth.clientId} onChange={clientId => onChange({ ...auth, clientId })} placeholder="client id" />
						</FormField>
						<FormField label="Client Secret" className="flex-1">
							<Input
								type="password"
								value={auth.clientSecret}
								onChange={clientSecret => onChange({ ...auth, clientSecret })}
								placeholder="••••••"
							/>
						</FormField>
					</div>
					{auth.grantType === "password" ? (
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
					) : null}
					<FormField label="Scope (optional)">
						<Input value={auth.scope} onChange={scope => onChange({ ...auth, scope })} placeholder="read write" />
					</FormField>
					<div>
						<Button variant="secondary" size="sm" onClick={getToken} disabled={loading || auth.tokenUrl === ""}>
							{loading ? <Spinner /> : "Get token"}
						</Button>
					</div>
				</>
			) : null}

			<FormField label="Access token">
				<Input
					value={auth.accessToken}
					onChange={accessToken => onChange({ ...auth, accessToken })}
					placeholder="sent as Bearer on the request"
				/>
			</FormField>
		</div>
	);
}
