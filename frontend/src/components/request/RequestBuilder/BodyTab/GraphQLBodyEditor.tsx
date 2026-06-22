import { JsonBuilder, Tabs, Textarea, type TabItem } from "@/components/ui";
import { useState } from "react";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import type { BodyDescriptor } from "@/lib/request/model";

type GraphQLBody = Extract<BodyDescriptor, { type: "graphql" }>;
type VarsView = "raw" | "tree";

const VIEWS: TabItem<VarsView>[] = [
	{ id: "raw", label: "Raw" },
	{ id: "tree", label: "Tree" },
];

export function GraphQLBodyEditor({ body }: { body: GraphQLBody }) {
	const patchDraft = useActiveRequestStore(state => state.patchDraft);
	const [view, setView] = useState<VarsView>("raw");

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<span className="text-xs font-medium text-muted">Query</span>
				<Textarea
					value={body.query}
					onChange={query => patchDraft({ body: { ...body, query } })}
					placeholder={"query {\n  users { id name }\n}"}
					rows={8}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium text-muted">Variables (JSON)</span>
					<Tabs tabs={VIEWS} value={view} onChange={setView} className="border-b-0" />
				</div>
				{view === "tree" ? (
					<JsonBuilder value={body.variables} onChange={variables => patchDraft({ body: { ...body, variables } })} />
				) : (
					<Textarea
						value={body.variables}
						onChange={variables => patchDraft({ body: { ...body, variables } })}
						placeholder={'{\n  "id": "{{userId}}"\n}'}
						rows={5}
					/>
				)}
			</div>
		</div>
	);
}
