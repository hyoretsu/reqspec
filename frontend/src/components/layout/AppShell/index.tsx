import { useEffect } from "react";
import { BottomNav } from "@/components/layout/AppShell/BottomNav";
import { LeftPanel } from "@/components/layout/AppShell/LeftPanel";
import { TopBar } from "@/components/layout/AppShell/TopBar";
import { CollectionsTree } from "@/components/collections/CollectionsTree";
import { CookieManager } from "@/components/cookies/CookieManager";
import { EnvironmentManager } from "@/components/environments/EnvironmentManager";
import { HistoryList } from "@/components/history/HistoryList";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { RequestBuilder } from "@/components/request/RequestBuilder";
import { TabStrip } from "@/components/request/TabStrip";
import { ResponseViewer } from "@/components/response/ResponseViewer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useSessionStore } from "@/lib/store/session.store";
import { useTabsStore } from "@/lib/store/tabs.store";

export function AppShell() {
	const isDesktop = useIsDesktop();
	const activePane = useSessionStore(state => state.activePane);
	const workspaceId = useSessionStore(state => state.activeWorkspaceId);
	const loadForWorkspace = useTabsStore(state => state.loadForWorkspace);

	// Restore (or initialize) the open tabs whenever the active workspace changes.
	useEffect(() => {
		void loadForWorkspace(workspaceId);
	}, [workspaceId, loadForWorkspace]);

	return (
		<div className="flex h-full flex-col bg-bg">
			<TopBar />
			<CommandPalette />

			{isDesktop ? (
				<div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
					<LeftPanel />
					<div className="flex min-h-0 flex-col border-r border-border">
						<TabStrip />
						<div className="min-h-0 flex-1">
							<RequestBuilder />
						</div>
					</div>
					<div className="min-h-0">
						<ResponseViewer />
					</div>
				</div>
			) : (
				<>
					<main className="flex min-h-0 flex-1 flex-col">
						{activePane === "request" ? <TabStrip /> : null}
						<div className="min-h-0 flex-1">
							{activePane === "collections" ? <CollectionsTree /> : null}
							{activePane === "request" ? <RequestBuilder /> : null}
							{activePane === "response" ? <ResponseViewer /> : null}
							{activePane === "environments" ? <EnvironmentManager /> : null}
							{activePane === "cookies" ? <CookieManager /> : null}
							{activePane === "history" ? <HistoryList /> : null}
						</div>
					</main>
					<BottomNav />
				</>
			)}
		</div>
	);
}
