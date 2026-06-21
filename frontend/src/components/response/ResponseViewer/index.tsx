import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, EmptyState, KeyValueList, Spinner, StatusBadge, Tabs, type TabItem } from "@/components/ui";
import { ResponseBodyTab } from "@/components/response/ResponseViewer/ResponseBodyTab";
import { ResponseCookiesTab } from "@/components/response/ResponseViewer/ResponseCookiesTab";
import * as requestsRepo from "@/lib/db/requests.repo";
import type { SavedExample } from "@/lib/db/types";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import { promptDialog } from "@/lib/ui/modal";

type ResponseSection = "body" | "headers" | "cookies";

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResponseViewer() {
	const [section, setSection] = useState<ResponseSection>("body");
	const response = useActiveRequestStore(state => state.response);
	const isSending = useActiveRequestStore(state => state.isSending);
	const requestId = useActiveRequestStore(state => state.requestId);
	const draft = useActiveRequestStore(state => state.draft);
	const qc = useQueryClient();

	const saveExample = async () => {
		if (!requestId || !response) return;
		const name = await promptDialog({ title: "Save response as example", defaultValue: "Example" });
		if (!name) return;
		const existing = (await requestsRepo.getRequest(requestId))?.examples ?? [];
		const example: SavedExample = {
			id: crypto.randomUUID(),
			name,
			createdAt: Date.now(),
			request: draft,
			response,
		};
		await requestsRepo.updateRequest(requestId, { examples: [...existing, example] });
		qc.invalidateQueries({ queryKey: ["request", requestId] });
	};

	if (isSending) {
		return (
			<div className="flex h-full items-center justify-center gap-2 text-muted">
				<Spinner /> Sending…
			</div>
		);
	}

	if (!response) {
		return <EmptyState title="No response yet" description="Send a request to see the response here." />;
	}

	if (response.error) {
		return <EmptyState title="Request failed" description={response.error} />;
	}

	const tabs: TabItem<ResponseSection>[] = [
		{ id: "body", label: "Body" },
		{ id: "headers", label: "Headers" },
		{ id: "cookies", label: "Cookies" },
	];

	return (
		<div className="flex h-full flex-col gap-3 p-3">
			<div className="flex items-center gap-4 text-xs text-muted">
				<StatusBadge status={response.status} statusText={response.statusText} />
				<span>{response.timeMs} ms</span>
				<span>{formatSize(response.bodyBytes)}</span>
				{requestId ? (
					<Button size="sm" variant="secondary" onClick={saveExample} className="ml-auto">
						Save as example
					</Button>
				) : null}
			</div>

			<Tabs tabs={tabs} value={section} onChange={setSection} />

			<div className="min-h-0 flex-1 overflow-auto">
				{section === "body" ? <ResponseBodyTab response={response} /> : null}
				{section === "headers" ? <KeyValueList items={response.headers} emptyLabel="No headers." /> : null}
				{section === "cookies" ? <ResponseCookiesTab response={response} /> : null}
			</div>
		</div>
	);
}
