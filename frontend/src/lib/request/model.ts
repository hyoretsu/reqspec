import { z } from "zod";

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

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
	z.object({ type: z.literal("graphql"), query: z.string(), variables: z.string() }),
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
	z.object({ type: z.literal("basic"), username: z.string(), password: z.string() }),
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
	z.object({ type: z.literal("digest"), username: z.string(), password: z.string() }),
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

export const requestModelSchema = z.object({
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

export function createKeyValue(partial: Partial<Omit<KeyValue, "id">> = {}): KeyValue {
	return {
		id: crypto.randomUUID(),
		key: partial.key ?? "",
		value: partial.value ?? "",
		enabled: partial.enabled ?? true,
	};
}

export function createEmptyRequest(): RequestModel {
	return {
		method: "GET",
		url: "",
		params: [],
		pathParams: [],
		headers: [],
		body: { type: "none" },
		auth: { type: "none" },
	};
}
