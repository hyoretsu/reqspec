import { Button, Input } from "@/components/ui";
import {
	canConnect,
	canSend,
	isValidWsUrl,
	statusLabel,
	type WsStatus,
} from "@/lib/protocols/websocket";
import type { WebSocketConfig } from "@/lib/request/model";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import { useWsConnection, useWsStore } from "@/lib/store/ws.store";
import { MessageComposer } from "./MessageComposer";
import { MessageLog } from "./MessageLog";

const DEFAULT_CONFIG: WebSocketConfig = {
	protocols: [],
	messageFormat: "text",
	draft: "",
};

const STATUS_COLOR: Record<WsStatus, string> = {
	idle: "bg-muted",
	connecting: "bg-warning",
	open: "bg-success",
	closed: "bg-muted",
	error: "bg-danger",
};

function StatusPill({ status }: { status: WsStatus }) {
	return (
		<span className="flex shrink-0 items-center gap-1.5 text-muted">
			<span className={`h-2 w-2 rounded-full ${STATUS_COLOR[status]}`} />
			{statusLabel(status)}
		</span>
	);
}

/** Connection-oriented WebSocket UI: endpoint + connect, message composer, message log. */
export function WebSocketPanel() {
	const requestId = useActiveRequestStore((state) => state.requestId);
	const url = useActiveRequestStore((state) => state.draft.url);
	const config =
		useActiveRequestStore((state) => state.draft.websocket) ?? DEFAULT_CONFIG;
	const patchDraft = useActiveRequestStore((state) => state.patchDraft);

	const connectionId = requestId ?? "scratch";
	const { status, log } = useWsConnection(connectionId);
	const connect = useWsStore((state) => state.connect);
	const disconnect = useWsStore((state) => state.disconnect);
	const send = useWsStore((state) => state.send);
	const clear = useWsStore((state) => state.clear);

	const setConfig = (patch: Partial<WebSocketConfig>) =>
		patchDraft({ websocket: { ...config, ...patch } });

	const connected = status === "open" || status === "connecting";

	return (
		<div className="flex h-full flex-col gap-3 p-3">
			<div className="flex flex-col gap-2 sm:flex-row">
				<Input
					value={url}
					onChange={(value) => patchDraft({ url: value })}
					placeholder="wss://echo.websocket.org"
					className="flex-1"
				/>
				{connected ? (
					<Button
						variant="danger"
						onClick={() => disconnect(connectionId)}
						className="sm:w-32"
					>
						Disconnect
					</Button>
				) : (
					<Button
						onClick={() => connect(connectionId, url, config.protocols)}
						disabled={!canConnect(status) || !isValidWsUrl(url)}
						className="sm:w-32"
					>
						Connect
					</Button>
				)}
			</div>

			<div className="flex items-center gap-3 text-xs">
				<StatusPill status={status} />
				<Input
					value={config.protocols.join(", ")}
					onChange={(value) =>
						setConfig({
							protocols: value
								.split(",")
								.map((p) => p.trim())
								.filter((p) => p !== ""),
						})
					}
					placeholder="Subprotocols (comma-separated)"
					className="h-8 flex-1"
				/>
			</div>

			<MessageComposer
				draft={config.draft}
				format={config.messageFormat}
				canSend={canSend(status)}
				onDraft={(value) => setConfig({ draft: value })}
				onFormat={(value) => setConfig({ messageFormat: value })}
				onSend={(payload) => send(connectionId, payload)}
			/>

			<MessageLog log={log} onClear={() => clear(connectionId)} />
		</div>
	);
}
