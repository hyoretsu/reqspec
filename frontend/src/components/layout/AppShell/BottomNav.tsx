import clsx from "clsx";
import { type MobilePane, useSessionStore } from "@/lib/store/session.store";

const ITEMS: { pane: MobilePane; label: string; icon: string }[] = [
	{ pane: "collections", label: "Collections", icon: "📁" },
	{ pane: "request", label: "Request", icon: "✏️" },
	{ pane: "response", label: "Response", icon: "📥" },
	{ pane: "environments", label: "Env", icon: "🧩" },
	{ pane: "cookies", label: "Cookies", icon: "🍪" },
	{ pane: "history", label: "History", icon: "🕘" },
];

export function BottomNav() {
	const activePane = useSessionStore(state => state.activePane);
	const setActivePane = useSessionStore(state => state.setActivePane);

	return (
		<nav className="flex shrink-0 border-t border-border bg-surface md:hidden">
			{ITEMS.map(item => (
				<button
					key={item.pane}
					type="button"
					onClick={() => setActivePane(item.pane)}
					className={clsx(
						"flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
						item.pane === activePane ? "text-primary" : "text-muted",
					)}
				>
					<span aria-hidden className="text-base">
						{item.icon}
					</span>
					{item.label}
				</button>
			))}
		</nav>
	);
}
