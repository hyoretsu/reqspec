import { useState } from "react";
import {
	Button,
	CustomSelect,
	Input,
	MethodBadge,
	type SelectOption,
	Spinner,
	Tabs,
	type TabItem,
} from "@/components/ui";
import { AuthTab } from "@/components/request/RequestBuilder/AuthTab";
import { BodyTab } from "@/components/request/RequestBuilder/BodyTab";
import { HeadersTab } from "@/components/request/RequestBuilder/HeadersTab";
import { ParamsTab } from "@/components/request/RequestBuilder/ParamsTab";
import type { RequestSection } from "@/components/request/RequestBuilder/types";
import { saveDraft } from "@/hooks/queries/use-requests";
import { useSendRequest } from "@/hooks/use-send-request";
import { HTTP_METHODS, type HttpMethod } from "@/lib/request/model";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

const METHOD_OPTIONS: SelectOption<HttpMethod>[] = HTTP_METHODS.map(method => ({
	label: method,
	value: method,
	adornment: <MethodBadge method={method} />,
}));

function enabledCount(items: { enabled: boolean; key: string }[]): number {
	return items.filter(i => i.enabled && i.key !== "").length;
}

export function RequestBuilder() {
	const [section, setSection] = useState<RequestSection>("params");
	const draft = useActiveRequestStore(state => state.draft);
	const requestId = useActiveRequestStore(state => state.requestId);
	const dirty = useActiveRequestStore(state => state.dirty);
	const isSending = useActiveRequestStore(state => state.isSending);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);
	const markSaved = useActiveRequestStore(state => state.markSaved);
	const send = useSendRequest();

	const tabs: TabItem<RequestSection>[] = [
		{ id: "params", label: "Params", badge: badge(enabledCount(draft.params)) },
		{ id: "headers", label: "Headers", badge: badge(enabledCount(draft.headers)) },
		{ id: "body", label: "Body", badge: draft.body.type !== "none" ? dot() : undefined },
		{ id: "auth", label: "Auth", badge: draft.auth.type !== "none" ? dot() : undefined },
	];

	const onSave = async () => {
		if (!requestId) return;
		await saveDraft(requestId, { request: draft });
		markSaved();
	};

	return (
		<div className="flex h-full flex-col gap-3 p-3">
			<div className="flex flex-col gap-2 sm:flex-row">
				<div className="flex gap-2">
					<CustomSelect
						aria-label="HTTP method"
						value={draft.method}
						options={METHOD_OPTIONS}
						onChange={method => patchDraft({ method })}
						className="w-32 shrink-0"
					/>
					<Input
						value={draft.url}
						onChange={url => patchDraft({ url })}
						placeholder="https://api.example.com/v1/users?id={{userId}}"
						className="flex-1"
					/>
				</div>
				<div className="flex gap-2">
					<Button onClick={send} disabled={isSending || draft.url.trim() === ""} className="flex-1 sm:flex-none">
						{isSending ? <Spinner /> : "Send"}
					</Button>
					{requestId ? (
						<Button variant="secondary" onClick={onSave} disabled={!dirty}>
							Save
						</Button>
					) : null}
				</div>
			</div>

			<Tabs tabs={tabs} value={section} onChange={setSection} />

			<div className="min-h-0 flex-1 overflow-auto">
				{section === "params" ? <ParamsTab /> : null}
				{section === "headers" ? <HeadersTab /> : null}
				{section === "body" ? <BodyTab /> : null}
				{section === "auth" ? <AuthTab /> : null}
			</div>
		</div>
	);
}

function badge(count: number) {
	if (count === 0) return undefined;
	return (
		<span className="rounded-full bg-surface px-1.5 text-[10px] font-semibold text-muted">{count}</span>
	);
}

function dot() {
	return <span className="h-1.5 w-1.5 rounded-full bg-primary" />;
}
