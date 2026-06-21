import {
	type AuthDescriptor,
	type BodyDescriptor,
	createEmptyRequest,
	createKeyValue,
	HTTP_METHODS,
	type HttpMethod,
	type KeyValue,
	type RequestModel,
} from "@/lib/request/model";

/** A request extracted from a Postman collection, with its folder path (names). */
export interface ImportedRequest {
	name: string;
	folderPath: string[];
	request: RequestModel;
}

export interface ImportedCollection {
	name: string;
	requests: ImportedRequest[];
	/** Collection-level variables, mapped to ReqSpec variables. */
	variables: KeyValue[];
}

export interface ImportedEnvironment {
	name: string;
	variables: KeyValue[];
}

export type PostmanImport =
	| { kind: "collection"; collection: ImportedCollection }
	| { kind: "environment"; environment: ImportedEnvironment };

// Loose shapes — Postman exports are permissive; only read what we map.
interface PMKeyVal {
	key?: string;
	value?: string;
	disabled?: boolean;
	enabled?: boolean;
	type?: string;
}
interface PMUrl {
	raw?: string;
	query?: PMKeyVal[];
}
interface PMBody {
	mode?: string;
	raw?: string;
	urlencoded?: PMKeyVal[];
	formdata?: PMKeyVal[];
	options?: { raw?: { language?: string } };
}
interface PMAuth {
	type?: string;
	basic?: PMKeyVal[];
	bearer?: PMKeyVal[];
}
interface PMRequest {
	method?: string;
	url?: PMUrl | string;
	header?: PMKeyVal[];
	body?: PMBody;
	auth?: PMAuth;
}
interface PMItem {
	name?: string;
	item?: PMItem[];
	request?: PMRequest;
	variable?: PMKeyVal[];
}
interface PMCollection {
	info?: { name?: string; schema?: string };
	item?: PMItem[];
	variable?: PMKeyVal[];
}
interface PMEnvironment {
	name?: string;
	values?: PMKeyVal[];
	_postman_variable_scope?: string;
}

function isEnabled(kv: PMKeyVal): boolean {
	if (typeof kv.enabled === "boolean") return kv.enabled;
	return kv.disabled !== true;
}

function toKeyValues(items: PMKeyVal[] | undefined): KeyValue[] {
	return (items ?? []).map(i =>
		createKeyValue({ key: i.key ?? "", value: i.value ?? "", enabled: isEnabled(i) }),
	);
}

function normalizeMethod(method: string | undefined): HttpMethod {
	const upper = (method ?? "GET").toUpperCase();
	return (HTTP_METHODS as readonly string[]).includes(upper) ? (upper as HttpMethod) : "GET";
}

/** Split a raw URL into its base (no query) and the query pairs encoded in it. */
function splitUrl(raw: string): { base: string; queryPairs: KeyValue[] } {
	const hashIndex = raw.indexOf("#");
	const fragment = hashIndex === -1 ? "" : raw.slice(hashIndex);
	const withoutFragment = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
	const qIndex = withoutFragment.indexOf("?");
	if (qIndex === -1) return { base: raw, queryPairs: [] };

	const base = withoutFragment.slice(0, qIndex) + fragment;
	const query = withoutFragment.slice(qIndex + 1);
	const queryPairs = query
		.split("&")
		.filter(Boolean)
		.map(pair => {
			const eq = pair.indexOf("=");
			const key = eq === -1 ? pair : pair.slice(0, eq);
			const value = eq === -1 ? "" : pair.slice(eq + 1);
			return createKeyValue({ key: decode(key), value: decode(value) });
		});
	return { base, queryPairs };
}

function decode(value: string): string {
	try {
		return decodeURIComponent(value.replace(/\+/g, " "));
	} catch {
		return value;
	}
}

function parseUrl(url: PMUrl | string | undefined): { url: string; params: KeyValue[] } {
	if (url === undefined) return { url: "", params: [] };
	if (typeof url === "string") {
		const { base, queryPairs } = splitUrl(url);
		return { url: base, params: queryPairs };
	}
	const raw = url.raw ?? "";
	// Prefer the structured query array; fall back to parsing the raw string.
	if (url.query && url.query.length > 0) {
		const { base } = splitUrl(raw);
		return { url: base, params: toKeyValues(url.query) };
	}
	const { base, queryPairs } = splitUrl(raw);
	return { url: base, params: queryPairs };
}

function parseBody(body: PMBody | undefined): BodyDescriptor {
	if (!body || !body.mode) return { type: "none" };
	switch (body.mode) {
		case "raw": {
			const language = body.options?.raw?.language;
			return { type: "raw", subtype: language === "json" ? "json" : "text", content: body.raw ?? "" };
		}
		case "urlencoded":
			return { type: "urlencoded", fields: toKeyValues(body.urlencoded) };
		case "formdata":
			// File fields can't carry a value here; keep the key with an empty value.
			return { type: "form-data", fields: toKeyValues(body.formdata) };
		default:
			return { type: "none" };
	}
}

function findValue(items: PMKeyVal[] | undefined, key: string): string {
	return items?.find(i => i.key === key)?.value ?? "";
}

function parseAuth(auth: PMAuth | undefined): AuthDescriptor {
	if (!auth) return { type: "none" };
	switch (auth.type) {
		case "basic":
			return {
				type: "basic",
				username: findValue(auth.basic, "username"),
				password: findValue(auth.basic, "password"),
			};
		case "bearer":
			return { type: "bearer", token: findValue(auth.bearer, "token") };
		default:
			return { type: "none" };
	}
}

function parseRequest(pm: PMRequest): RequestModel {
	const { url, params } = parseUrl(pm.url);
	return {
		...createEmptyRequest(),
		method: normalizeMethod(pm.method),
		url,
		params,
		headers: toKeyValues(pm.header),
		body: parseBody(pm.body),
		auth: parseAuth(pm.auth),
	};
}

function walkItems(items: PMItem[] | undefined, folderPath: string[], out: ImportedRequest[]): void {
	for (const item of items ?? []) {
		if (item.item) {
			walkItems(item.item, [...folderPath, item.name ?? "Folder"], out);
		} else if (item.request) {
			out.push({ name: item.name ?? "Untitled request", folderPath, request: parseRequest(item.request) });
		}
	}
}

/** Detect which kind of Postman export a parsed JSON object represents. */
export function detectPostmanKind(json: unknown): "collection" | "environment" | null {
	if (typeof json !== "object" || json === null) return null;
	const obj = json as Record<string, unknown>;
	if ("_postman_variable_scope" in obj || (Array.isArray(obj.values) && !("item" in obj))) {
		return "environment";
	}
	if ("item" in obj || (typeof obj.info === "object" && obj.info !== null)) return "collection";
	return null;
}

export function parsePostmanCollection(json: unknown): ImportedCollection {
	const col = (json ?? {}) as PMCollection;
	const requests: ImportedRequest[] = [];
	walkItems(col.item, [], requests);
	return {
		name: col.info?.name ?? "Imported collection",
		requests,
		variables: toKeyValues(col.variable),
	};
}

export function parsePostmanEnvironment(json: unknown): ImportedEnvironment {
	const env = (json ?? {}) as PMEnvironment;
	return {
		name: env.name ?? "Imported environment",
		variables: toKeyValues(env.values),
	};
}

/** Parse a Postman export of unknown kind. Throws if it is neither shape. */
export function parsePostman(json: unknown): PostmanImport {
	const kind = detectPostmanKind(json);
	if (kind === "collection") return { kind, collection: parsePostmanCollection(json) };
	if (kind === "environment") return { kind, environment: parsePostmanEnvironment(json) };
	throw new Error("Unrecognized file: not a Postman collection or environment export.");
}
