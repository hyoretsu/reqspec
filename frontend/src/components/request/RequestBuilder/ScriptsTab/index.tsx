import { useState } from "react";
import { Tabs, type TabItem } from "@/components/ui";
import { ScriptEditor } from "@/components/request/RequestBuilder/ScriptsTab/ScriptEditor";
import { PRE_REQUEST_SNIPPETS, TEST_SNIPPETS } from "@/components/request/RequestBuilder/ScriptsTab/snippets";
import { getEventScript, type ScriptEvent, setEventScript } from "@/lib/request/model";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

const VIEWS: TabItem<ScriptEvent["listen"]>[] = [
	{ id: "prerequest", label: "Pre-request" },
	{ id: "test", label: "Tests" },
];

export function ScriptsTab() {
	const [view, setView] = useState<ScriptEvent["listen"]>("prerequest");
	const events = useActiveRequestStore(state => state.draft.events);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	const setScript = (listen: ScriptEvent["listen"], script: string) => {
		const current = useActiveRequestStore.getState().draft.events;
		patchDraft({ events: setEventScript(current, listen, script) });
	};

	return (
		<div className="flex flex-col gap-2">
			<Tabs tabs={VIEWS} value={view} onChange={setView} />
			{view === "prerequest" ? (
				<ScriptEditor
					value={getEventScript(events, "prerequest")}
					onChange={script => setScript("prerequest", script)}
					snippets={PRE_REQUEST_SNIPPETS}
					placeholder={'// Runs before the request is sent.\npm.environment.set("ts", Date.now().toString());'}
				/>
			) : (
				<ScriptEditor
					value={getEventScript(events, "test")}
					onChange={script => setScript("test", script)}
					snippets={TEST_SNIPPETS}
					placeholder={'// Runs after the response arrives.\npm.test("Status is 200", () => {\n\tpm.response.to.have.status(200);\n});'}
				/>
			)}
		</div>
	);
}
