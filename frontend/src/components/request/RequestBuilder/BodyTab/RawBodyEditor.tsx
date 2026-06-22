import { useState } from "react";
import { Button, CustomSelect, JsonBuilder, Tabs, Textarea, type SelectOption, type TabItem } from "@/components/ui";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import type { BodyDescriptor } from "@/lib/request/model";

type RawBody = Extract<BodyDescriptor, { type: "raw" }>;
type Subtype = RawBody["subtype"];
type JsonView = "raw" | "tree";

const SUBTYPE_OPTIONS: SelectOption<Subtype>[] = [
	{ label: "JSON", value: "json" },
	{ label: "Text", value: "text" },
];

const JSON_VIEWS: TabItem<JsonView>[] = [
	{ id: "raw", label: "Raw" },
	{ id: "tree", label: "Tree" },
];

export function RawBodyEditor({ body }: { body: RawBody }) {
	const patchDraft = useActiveRequestStore(state => state.patchDraft);
	const [view, setView] = useState<JsonView>("raw");
	const [error, setError] = useState<string | null>(null);

	const setContent = (content: string) => patchDraft({ body: { ...body, content } });

	const reformat = (minify: boolean) => {
		try {
			const parsed = JSON.parse(body.content);
			setContent(JSON.stringify(parsed, null, minify ? 0 : 2));
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Invalid JSON");
		}
	};

	const validate = () => {
		try {
			JSON.parse(body.content);
			setError("Valid JSON ✓");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Invalid JSON");
		}
	};

	const isJson = body.subtype === "json";

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-2">
				<CustomSelect
					aria-label="Raw body type"
					value={body.subtype}
					options={SUBTYPE_OPTIONS}
					onChange={subtype => patchDraft({ body: { ...body, subtype } })}
					className="w-32"
				/>
				{isJson ? (
					<>
						<Tabs tabs={JSON_VIEWS} value={view} onChange={setView} className="border-b-0" />
						{view === "raw" ? (
							<div className="flex gap-1">
								<Button variant="secondary" size="sm" onClick={() => reformat(false)}>
									Prettify
								</Button>
								<Button variant="secondary" size="sm" onClick={() => reformat(true)}>
									Minify
								</Button>
								<Button variant="secondary" size="sm" onClick={validate}>
									Validate
								</Button>
							</div>
						) : null}
					</>
				) : null}
			</div>

			{isJson && view === "tree" ? (
				<JsonBuilder value={body.content} onChange={setContent} />
			) : (
				<Textarea
					value={body.content}
					onChange={content => {
						setContent(content);
						setError(null);
					}}
					placeholder={isJson ? '{\n  "key": "value"\n}' : "Raw request body"}
					rows={10}
				/>
			)}

			{error ? (
				<p className={error.endsWith("✓") ? "text-xs text-success" : "text-xs text-danger"}>{error}</p>
			) : null}
		</div>
	);
}
