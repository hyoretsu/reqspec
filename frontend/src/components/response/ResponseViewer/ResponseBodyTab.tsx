import { useState } from "react";
import { CodeBlock, Tabs, type TabItem } from "@/components/ui";
import { prettyPrintBody } from "@/lib/http/normalize";
import type { NormalizedResponse } from "@/lib/http/types";

type View = "pretty" | "raw";

const VIEWS: TabItem<View>[] = [
	{ id: "pretty", label: "Pretty" },
	{ id: "raw", label: "Raw" },
];

export function ResponseBodyTab({ response }: { response: NormalizedResponse }) {
	const [view, setView] = useState<View>("pretty");

	if (response.bodyText === "") {
		return <p className="p-3 text-xs text-muted">Empty response body.</p>;
	}

	const content =
		view === "pretty" ? prettyPrintBody(response.bodyText, response.contentType) : response.bodyText;

	return (
		<div className="flex flex-col gap-2">
			<Tabs tabs={VIEWS} value={view} onChange={setView} />
			<CodeBlock content={content} />
		</div>
	);
}
