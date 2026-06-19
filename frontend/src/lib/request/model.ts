import { z } from "zod";

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const keyValueSchema = z.object({
	id: z.string(),
	key: z.string(),
	value: z.string(),
	enabled: z.boolean(),
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
]);
export type BodyDescriptor = z.infer<typeof bodyDescriptorSchema>;

export const authDescriptorSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("none") }),
	z.object({ type: z.literal("basic"), username: z.string(), password: z.string() }),
	z.object({ type: z.literal("bearer"), token: z.string() }),
]);
export type AuthDescriptor = z.infer<typeof authDescriptorSchema>;

export const requestModelSchema = z.object({
	method: z.enum(HTTP_METHODS),
	url: z.string(),
	params: z.array(keyValueSchema),
	headers: z.array(keyValueSchema),
	body: bodyDescriptorSchema,
	auth: authDescriptorSchema,
});
export type RequestModel = z.infer<typeof requestModelSchema>;

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
		headers: [],
		body: { type: "none" },
		auth: { type: "none" },
	};
}
