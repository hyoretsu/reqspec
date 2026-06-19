import { BottomNav } from "@/components/layout/AppShell/BottomNav";
import { LeftPanel } from "@/components/layout/AppShell/LeftPanel";
import { TopBar } from "@/components/layout/AppShell/TopBar";
import { CollectionsTree } from "@/components/collections/CollectionsTree";
import { EnvironmentManager } from "@/components/environments/EnvironmentManager";
import { HistoryList } from "@/components/history/HistoryList";
import { RequestBuilder } from "@/components/request/RequestBuilder";
import { ResponseViewer } from "@/components/response/ResponseViewer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useSessionStore } from "@/lib/store/session.store";

export function AppShell() {
	const isDesktop = useIsDesktop();
	const activePane = useSessionStore(state => state.activePane);

	return (
		<div className="flex h-full flex-col bg-bg">
			<TopBar />

			{isDesktop ? (
				<div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
					<LeftPanel />
					<div className="min-h-0 border-r border-border">
						<RequestBuilder />
					</div>
					<div className="min-h-0">
						<ResponseViewer />
					</div>
				</div>
			) : (
				<>
					<main className="min-h-0 flex-1">
						{activePane === "collections" ? <CollectionsTree /> : null}
						{activePane === "request" ? <RequestBuilder /> : null}
						{activePane === "response" ? <ResponseViewer /> : null}
						{activePane === "environments" ? <EnvironmentManager /> : null}
						{activePane === "history" ? <HistoryList /> : null}
					</main>
					<BottomNav />
				</>
			)}
		</div>
	);
}
