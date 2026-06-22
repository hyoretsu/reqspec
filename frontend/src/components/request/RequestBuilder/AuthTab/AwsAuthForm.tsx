import { FormField, Input } from "@/components/ui";
import type { AuthDescriptor } from "@/lib/request/model";

type AwsAuth = Extract<AuthDescriptor, { type: "awsv4" }>;

export function AwsAuthForm({ auth, onChange }: { auth: AwsAuth; onChange: (a: AwsAuth) => void }) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-3 sm:flex-row">
				<FormField label="Access Key ID" className="flex-1">
					<Input
						value={auth.accessKeyId}
						onChange={accessKeyId => onChange({ ...auth, accessKeyId })}
						placeholder="AKIA…"
					/>
				</FormField>
				<FormField label="Secret Access Key" className="flex-1">
					<Input
						type="password"
						value={auth.secretAccessKey}
						onChange={secretAccessKey => onChange({ ...auth, secretAccessKey })}
						placeholder="••••••"
					/>
				</FormField>
			</div>
			<div className="flex flex-col gap-3 sm:flex-row">
				<FormField label="Region" className="flex-1">
					<Input value={auth.region} onChange={region => onChange({ ...auth, region })} placeholder="us-east-1" />
				</FormField>
				<FormField label="Service" className="flex-1">
					<Input value={auth.service} onChange={service => onChange({ ...auth, service })} placeholder="s3" />
				</FormField>
			</div>
			<FormField label="Session token (optional)">
				<Input
					value={auth.sessionToken}
					onChange={sessionToken => onChange({ ...auth, sessionToken })}
					placeholder="for temporary credentials"
				/>
			</FormField>
		</div>
	);
}
