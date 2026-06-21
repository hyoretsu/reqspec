import { useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useState } from "react";
import { Tabs, Textarea, type TabItem } from "@/components/ui";
import * as requestsRepo from "@/lib/db/requests.repo";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

type DocsView = "edit" | "preview";

const VIEWS: TabItem<DocsView>[] = [
	{ id: "edit", label: "Edit" },
	{ id: "preview", label: "Preview" },
];

function renderMarkdown(md: string): string {
	return DOMPurify.sanitize(marked.parse(md, { async: false }));
}

export function DocsTab() {
	const requestId = useActiveRequestStore(state => state.requestId);
	const [view, setView] = useState<DocsView>("edit");
	const qc = useQueryClient();

	const { data: row } = useQuery({
		queryKey: ["request", requestId],
		queryFn: () => (requestId ? requestsRepo.getRequest(requestId) : null),
		enabled: requestId !== null,
	});

	if (!requestId) {
		return <p className="text-xs text-muted">Save this request to add documentation.</p>;
	}

	const description = row?.description ?? "";

	const onChange = async (next: string) => {
		await requestsRepo.updateRequest(requestId, { description: next });
		qc.invalidateQueries({ queryKey: ["request", requestId] });
	};

	return (
		<div className="flex flex-col gap-2">
			<Tabs tabs={VIEWS} value={view} onChange={setView} />
			{view === "edit" ? (
				<Textarea
					value={description}
					onChange={onChange}
					placeholder="# Notes&#10;Describe this request in **Markdown**…"
					rows={12}
				/>
			) : (
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized with DOMPurify
				<div
					className="prose prose-sm max-w-none text-sm text-fg"
					dangerouslySetInnerHTML={{ __html: renderMarkdown(description) }}
				/>
			)}
		</div>
	);
}
