import { CustomSelect, FormField, type SelectOption } from "@/components/ui";
import { ApiKeyAuthForm } from "@/components/request/RequestBuilder/AuthTab/ApiKeyAuthForm";
import { AwsAuthForm } from "@/components/request/RequestBuilder/AuthTab/AwsAuthForm";
import { BasicAuthForm } from "@/components/request/RequestBuilder/AuthTab/BasicAuthForm";
import { BearerAuthForm } from "@/components/request/RequestBuilder/AuthTab/BearerAuthForm";
import { type AuthType, defaultAuth } from "@/components/request/RequestBuilder/AuthTab/defaults";
import { OAuth2AuthForm } from "@/components/request/RequestBuilder/AuthTab/OAuth2AuthForm";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

const AUTH_OPTIONS: SelectOption<AuthType>[] = [
	{ label: "No Auth", value: "none" },
	{ label: "Basic", value: "basic" },
	{ label: "Bearer Token", value: "bearer" },
	{ label: "API Key", value: "apikey" },
	{ label: "AWS Signature v4", value: "awsv4" },
	{ label: "OAuth 2.0", value: "oauth2" },
];

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

			{auth.type === "basic" ? <BasicAuthForm auth={auth} onChange={a => patchDraft({ auth: a })} /> : null}
			{auth.type === "bearer" ? <BearerAuthForm auth={auth} onChange={a => patchDraft({ auth: a })} /> : null}
			{auth.type === "apikey" ? <ApiKeyAuthForm auth={auth} onChange={a => patchDraft({ auth: a })} /> : null}
			{auth.type === "awsv4" ? <AwsAuthForm auth={auth} onChange={a => patchDraft({ auth: a })} /> : null}
			{auth.type === "oauth2" ? <OAuth2AuthForm auth={auth} onChange={a => patchDraft({ auth: a })} /> : null}
		</div>
	);
}
