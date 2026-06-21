import clsx from "clsx";
import { IconButton } from "@/components/ui";
import { useTabsStore } from "@/lib/store/tabs.store";

export function TabStrip() {
	const tabs = useTabsStore(state => state.tabs);
	const activeTabId = useTabsStore(state => state.activeTabId);
	const switchTo = useTabsStore(state => state.switchTo);
	const closeTab = useTabsStore(state => state.closeTab);
	const openScratch = useTabsStore(state => state.openScratch);

	return (
		<div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-surface px-1">
			{tabs.map(tab => (
				<div
					key={tab.id}
					className={clsx(
						"group flex shrink-0 items-center gap-1 rounded-t border-b-2 px-2 py-1.5 text-xs transition-colors",
						tab.id === activeTabId
							? "border-primary text-fg"
							: "border-transparent text-muted hover:text-fg",
					)}
				>
					<button type="button" onClick={() => switchTo(tab.id)} className="max-w-40 truncate text-left">
						{tab.name || "Untitled"}
					</button>
					<IconButton
						label="Close tab"
						onClick={() => closeTab(tab.id)}
						className="h-5 w-5 opacity-0 group-hover:opacity-100"
					>
						✕
					</IconButton>
				</div>
			))}
			<IconButton label="New request tab" onClick={openScratch} className="shrink-0">
				+
			</IconButton>
		</div>
	);
}
