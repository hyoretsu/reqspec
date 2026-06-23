/**
 * WebSocket protocol — pure helpers (M9).
 *
 * URL normalization, message-log construction, outgoing-payload validation, and
 * connection-status predicates. All side-effect free so they are 100% unit-coverable;
 * the live socket wiring (the browser `WebSocket` global) lives in the store glue.
 */

/** Connection lifecycle state for a single WebSocket. */
export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error";

/** Direction of a log entry: client→server, server→client, or a local system note. */
export type WsDirection = "in" | "out" | "system";

export interface WsLogEntry {
	id: string;
	direction: WsDirection;
	data: string;
	at: number;
}

/**
 * Normalize a user-typed endpoint to a `ws://`/`wss://` URL: trims, upgrades
 * `http`/`https` schemes, and defaults a bare host to `ws://`. Returns the input
 * trimmed when it already looks like a ws URL.
 */
export function normalizeWsUrl(raw: string): string {
	const trimmed = raw.trim();
	if (trimmed === "") return "";
	if (/^wss?:\/\//i.test(trimmed)) return trimmed;
	if (/^https:\/\//i.test(trimmed))
		return trimmed.replace(/^https:\/\//i, "wss://");
	if (/^http:\/\//i.test(trimmed))
		return trimmed.replace(/^http:\/\//i, "ws://");
	return `ws://${trimmed}`;
}

/** Whether the normalized endpoint parses as a valid ws/wss URL. */
export function isValidWsUrl(raw: string): boolean {
	const normalized = normalizeWsUrl(raw);
	if (normalized === "") return false;
	try {
		const url = new URL(normalized);
		return (
			(url.protocol === "ws:" || url.protocol === "wss:") && url.host !== ""
		);
	} catch {
		return false;
	}
}

/** Build a log entry with a fresh id and timestamp (clock injectable for tests). */
export function makeLogEntry(
	direction: WsDirection,
	data: string,
	now: number = Date.now(),
): WsLogEntry {
	return { id: crypto.randomUUID(), direction, data, at: now };
}

export type ValidateResult =
	| { ok: true; value: string }
	| { ok: false; error: string };

/**
 * Validate a composer payload for sending. `text` always passes; `json` must parse
 * and is re-serialized compactly so the wire payload is canonical.
 */
export function validateOutgoing(
	data: string,
	format: "text" | "json",
): ValidateResult {
	if (format === "text") return { ok: true, value: data };
	try {
		return { ok: true, value: JSON.stringify(JSON.parse(data)) };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Invalid JSON",
		};
	}
}

/** A message may be sent only on an open connection. */
export function canSend(status: WsStatus): boolean {
	return status === "open";
}

/** Connect is allowed only when not already connecting/open. */
export function canConnect(status: WsStatus): boolean {
	return status === "idle" || status === "closed" || status === "error";
}

/** Human-readable label for a status (UI badge). */
export function statusLabel(status: WsStatus): string {
	const labels: Record<WsStatus, string> = {
		idle: "Disconnected",
		connecting: "Connecting…",
		open: "Connected",
		closed: "Disconnected",
		error: "Error",
	};
	return labels[status];
}
