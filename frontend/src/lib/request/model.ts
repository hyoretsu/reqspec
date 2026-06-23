import { z } from "zod";

export const HTTP_METHODS = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

/**
 * Protocol a request speaks. `http`/`graphql` use the request/response model; the
 * realtime + gRPC kinds are connection-oriented (M9). Stored on {@link RequestModel}
 * as a discriminant so storage/builder/tabs can stay protocol-agnostic — a request
 * without the field is treated as `http` (backward compatible with pre-M9 rows).
 */
export const PROTOCOLS = [
	"http",
	"graphql",
	"websocket",
	"socketio",
	"mqtt",
	"grpc",
] as const;
export type ProtocolKind = (typeof PROTOCOLS)[number];

/** Per-request WebSocket configuration (handshake subprotocols + persisted composer draft). */
export const webSocketConfigSchema = z.object({
	/** `Sec-WebSocket-Protocol` subprotocols offered on connect. */
	protocols: z.array(z.string()).default([]),
	/** How the composer interprets/validates the outgoing draft. */
	messageFormat: z.enum(["text", "json"]).default("text"),
	/** Last composer content, persisted so it survives tab/session switches. */
	draft: z.string().default(""),
});
export type WebSocketConfig = z.infer<typeof webSocketConfigSchema>;

export const keyValueSchema = z.object({
	id: z.string(),
	key: z.string(),
	value: z.string(),
	enabled: z.boolean(),
	/** Variables only: mask the value in the UI and exclude from plain exports. */
	secret: z.boolean().optional(),
	/** form-data only: "file" rows send a picked file (held in the session file store). */
	kind: z.enum(["text", "file"]).optional(),
	/** form-data file rows: the selected file's name (the bytes live in the file store). */
	fileName: z.string().optional(),
});
export type KeyValue = z.infer<typeof keyValueSchema>;

export const bodyDescriptorSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("none") }),
	z.object({
		type: z.literal("raw"),
		subtype: z.enum(["json", "text"]),
		content: z.string(),
	}),
	z.object({ type: z.literal("form-data"), fields: z.array(keyValueSchema) }),
	z.object({ type: z.literal("urlencoded"), fields: z.array(keyValueSchema) }),
	z.object({
		type: z.literal("graphql"),
		query: z.string(),
		variables: z.string(),
	}),
	z.object({
		type: z.literal("binary"),
		/** Key into the session file store holding the picked file's bytes. */
		fileId: z.string(),
		/** Display name of the picked file (the bytes live in the file store). */
		fileName: z.string(),
		/** Sent as Content-Type; defaults to the file's own MIME type when blank. */
		contentType: z.string(),
	}),
]);
export type BodyDescriptor = z.infer<typeof bodyDescriptorSchema>;
export type BodyType = BodyDescriptor["type"];

export const authDescriptorSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("none") }),
	z.object({
		type: z.literal("basic"),
		username: z.string(),
		password: z.string(),
	}),
	z.object({ type: z.literal("bearer"), token: z.string() }),
	z.object({
		type: z.literal("apikey"),
		key: z.string(),
		value: z.string(),
		addTo: z.enum(["header", "query"]),
	}),
	z.object({
		type: z.literal("awsv4"),
		accessKeyId: z.string(),
		secretAccessKey: z.string(),
		region: z.string(),
		service: z.string(),
		sessionToken: z.string(),
	}),
	z.object({
		type: z.literal("digest"),
		username: z.string(),
		password: z.string(),
	}),
	z.object({
		type: z.literal("oauth2"),
		grantType: z.enum(["client_credentials", "password", "token"]),
		accessToken: z.string(),
		tokenUrl: z.string(),
		clientId: z.string(),
		clientSecret: z.string(),
		username: z.string(),
		password: z.string(),
		scope: z.string(),
	}),
]);
export type AuthDescriptor = z.infer<typeof authDescriptorSchema>;
export type AuthType = AuthDescriptor["type"];

/** A pre-request or test script attached to a request, in Postman's event shape. */
export const scriptEventSchema = z.object({
	listen: z.enum(["prerequest", "test"]),
	script: z.string(),
});
export type ScriptEvent = z.infer<typeof scriptEventSchema>;

export const requestModelSchema = z.object({
	/** Protocol discriminant; absent ⇒ `http`. See {@link PROTOCOLS}. */
	protocol: z.enum(PROTOCOLS).default("http"),
	method: z.enum(HTTP_METHODS),
	url: z.string(),
	params: z.array(keyValueSchema),
	/** Values for the `:name` path-param tokens declared inline in `url`. */
	pathParams: z.array(keyValueSchema).default([]),
	headers: z.array(keyValueSchema),
	body: bodyDescriptorSchema,
	auth: authDescriptorSchema,
	/**
	 * Stashed content of every body/auth variant the user has edited, keyed by its
	 * `type`. Lets switching the body/auth type preserve the data of the type left
	 * behind, so going back restores it instead of an empty default. See {@link switchVariant}.
	 */
	bodyDrafts: z.record(z.string(), bodyDescriptorSchema).optional(),
	authDrafts: z.record(z.string(), authDescriptorSchema).optional(),
	/** Pre-request and test scripts (QuickJS), in Postman's event shape. */
	events: z.array(scriptEventSchema).default([]),
	/** WebSocket config; present when `protocol === "websocket"`. */
	websocket: webSocketConfigSchema.optional(),
});
export type RequestModel = z.infer<typeof requestModelSchema>;

/** A cache of every variant a discriminated config has held, keyed by its `type`. */
export type VariantDrafts<T extends { type: string }> = Record<string, T>;

/**
 * Switch a discriminated config (body/auth) to another `type` without losing the
 * data of the one being left. The outgoing variant is stashed into `drafts`; the
 * incoming variant is restored from `drafts` if previously edited, else freshly
 * defaulted. Returns the new active value and the updated draft cache.
 */
export function switchVariant<T extends { type: string }>(
	current: T,
	nextType: T["type"],
	drafts: VariantDrafts<T> | undefined,
	makeDefault: (type: T["type"]) => T,
): { value: T; drafts: VariantDrafts<T> } {
	const nextDrafts: VariantDrafts<T> = { ...drafts, [current.type]: current };
	const value = nextDrafts[nextType] ?? makeDefault(nextType);
	return { value, drafts: nextDrafts };
}

export function createKeyValue(
	partial: Partial<Omit<KeyValue, "id">> = {},
): KeyValue {
	return {
		id: crypto.randomUUID(),
		key: partial.key ?? "",
		value: partial.value ?? "",
		enabled: partial.enabled ?? true,
	};
}

export function createEmptyRequest(): RequestModel {
	return {
		protocol: "http",
		method: "GET",
		url: "",
		params: [],
		pathParams: [],
		headers: [],
		body: { type: "none" },
		auth: { type: "none" },
		events: [],
	};
}

/** A blank WebSocket request: same base as HTTP but with the `websocket` protocol + config. */
export function createEmptyWebSocketRequest(): RequestModel {
	return {
		...createEmptyRequest(),
		protocol: "websocket",
		url: "",
		websocket: { protocols: [], messageFormat: "text", draft: "" },
	};
}

/** Read the script source for a given event kind, or "" when absent. */
export function getEventScript(
	events: ScriptEvent[],
	listen: ScriptEvent["listen"],
): string {
	return events.find((e) => e.listen === listen)?.script ?? "";
}

/** Upsert a script for an event kind; an empty/whitespace-only script removes it. */
export function setEventScript(
	events: ScriptEvent[],
	listen: ScriptEvent["listen"],
	script: string,
): ScriptEvent[] {
	const without = events.filter((e) => e.listen !== listen);
	return script.trim() === "" ? without : [...without, { listen, script }];
}
