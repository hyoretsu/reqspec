import { useState } from "react";
import { Tabs, type TabItem } from "@/components/ui";
import { CollectionsTree } from "@/components/collections/CollectionsTree";
import { CookieManager } from "@/components/cookies/CookieManager";
import { EnvironmentManager } from "@/components/environments/EnvironmentManager";
import { HistoryList } from "@/components/history/HistoryList";

type LeftTab = "collections" | "history" | "environments" | "cookies";

const TABS: TabItem<LeftTab>[] = [
	{ id: "collections", label: "Collections" },
	{ id: "history", label: "History" },
	{ id: "environments", label: "Env" },
	{ id: "cookies", label: "Cookies" },
];

/** Desktop-only left sidebar with internal tabs (mobile uses the bottom nav instead). */
export function LeftPanel() {
	const [tab, setTab] = useState<LeftTab>("collections");

	return (
		<div className="flex h-full flex-col border-r border-border">
			<Tabs tabs={TABS} value={tab} onChange={setTab} className="px-2 pt-1" />
			<div className="min-h-0 flex-1">
				{tab === "collections" ? <CollectionsTree /> : null}
				{tab === "history" ? <HistoryList /> : null}
				{tab === "environments" ? <EnvironmentManager /> : null}
				{tab === "cookies" ? <CookieManager /> : null}
			</div>
		</div>
	);
}
