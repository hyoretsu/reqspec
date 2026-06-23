import { Button } from "@/components/ui";
import type { WsLogEntry } from "@/lib/protocols/websocket";

const DIRECTION_STYLE: Record<
	WsLogEntry["direction"],
	{ arrow: string; color: string }
> = {
	in: { arrow: "↓", color: "text-success" },
	out: { arrow: "↑", color: "text-primary" },
	system: { arrow: "•", color: "text-muted" },
};

/** Scrollable, newest-last log of WebSocket traffic and connection events. */
export function MessageLog({
	log,
	onClear,
}: {
	log: WsLogEntry[];
	onClear: () => void;
}) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex items-center justify-between pb-1">
				<span className="text-xs font-medium text-muted">Messages</span>
				<Button
					variant="secondary"
					size="sm"
					onClick={onClear}
					disabled={log.length === 0}
				>
					Clear
				</Button>
			</div>
			<div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
				{log.length === 0 ? (
					<p className="p-3 text-center text-xs text-muted">No messages yet.</p>
				) : (
					<ul className="divide-y divide-border">
						{log.map((entry) => {
							const style = DIRECTION_STYLE[entry.direction];
							return (
								<li
									key={entry.id}
									className="flex items-start gap-2 px-3 py-1.5 font-mono text-xs"
								>
									<span className={`shrink-0 ${style.color}`}>
										{style.arrow}
									</span>
									<span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-fg">
										{entry.data}
									</span>
									<span className="shrink-0 text-muted">
										{new Date(entry.at).toLocaleTimeString()}
									</span>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
