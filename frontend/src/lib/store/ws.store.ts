import { create } from "zustand";
import {
	makeLogEntry,
	normalizeWsUrl,
	type WsDirection,
	type WsLogEntry,
	type WsStatus,
} from "@/lib/protocols/websocket";

/** Per-connection runtime state (not persisted; cleared when the panel unmounts). */
interface WsConnection {
	status: WsStatus;
	log: WsLogEntry[];
}

interface WsState {
	connections: Record<string, WsConnection>;
	connect: (id: string, url: string, protocols: string[]) => void;
	send: (id: string, data: string) => void;
	disconnect: (id: string) => void;
	clear: (id: string) => void;
}

const EMPTY: WsConnection = { status: "idle", log: [] };

/** Live sockets, kept outside the store so React state stays serializable. */
const sockets = new Map<string, WebSocket>();

export const useWsStore = create<WsState>()((set, get) => {
	const setConn = (id: string, patch: Partial<WsConnection>) =>
		set((state) => {
			const current = state.connections[id] ?? EMPTY;
			return {
				connections: { ...state.connections, [id]: { ...current, ...patch } },
			};
		});
	const append = (id: string, direction: WsDirection, data: string) =>
		set((state) => {
			const current = state.connections[id] ?? EMPTY;
			return {
				connections: {
					...state.connections,
					[id]: {
						...current,
						log: [...current.log, makeLogEntry(direction, data)],
					},
				},
			};
		});

	return {
		connections: {},
		connect: (id, url, protocols) => {
			sockets.get(id)?.close();
			const target = normalizeWsUrl(url);
			setConn(id, { status: "connecting" });
			append(id, "system", `Connecting to ${target}`);
			let socket: WebSocket;
			try {
				socket =
					protocols.length > 0
						? new WebSocket(target, protocols)
						: new WebSocket(target);
			} catch (err) {
				setConn(id, { status: "error" });
				append(
					id,
					"system",
					err instanceof Error ? err.message : "Failed to open socket",
				);
				return;
			}
			sockets.set(id, socket);
			socket.onopen = () => {
				setConn(id, { status: "open" });
				append(id, "system", "Connected");
			};
			socket.onmessage = (event) => {
				const data = typeof event.data === "string" ? event.data : "[binary]";
				append(id, "in", data);
			};
			socket.onerror = () => {
				setConn(id, { status: "error" });
				append(id, "system", "Socket error");
			};
			socket.onclose = (event) => {
				sockets.delete(id);
				setConn(id, { status: "closed" });
				append(id, "system", `Closed${event.code ? ` (${event.code})` : ""}`);
			};
		},
		send: (id, data) => {
			const socket = sockets.get(id);
			if (!socket || socket.readyState !== WebSocket.OPEN) return;
			socket.send(data);
			append(id, "out", data);
		},
		disconnect: (id) => {
			sockets.get(id)?.close();
		},
		clear: (id) => {
			const current = get().connections[id];
			if (current) setConn(id, { log: [] });
		},
	};
});

/** Read a connection's state, falling back to the empty default. */
export function useWsConnection(id: string): WsConnection {
	return useWsStore((state) => state.connections[id] ?? EMPTY);
}
