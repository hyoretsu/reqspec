import { createKeyValue, type KeyValue } from "@/lib/request/model";

/** A path-param token: `:name`, declared inline in the URL path (Express/Postman style). */
const PATH_PARAM_RE = /:([A-Za-z_][A-Za-z0-9_]*)/g;

function decode(value: string): string {
	try {
		return decodeURIComponent(value.replace(/\+/g, " "));
	} catch {
		return value;
	}
}

/**
 * Split a URL-bar string into its base (scheme + host + path, `:tokens` intact) and the
 * query params parsed from everything after the first `?`. Values are decoded for display.
 */
export function splitUrl(input: string): { base: string; params: KeyValue[] } {
	const qIndex = input.indexOf("?");
	if (qIndex === -1) return { base: input, params: [] };
	const base = input.slice(0, qIndex);
	const params = input
		.slice(qIndex + 1)
		.split("&")
		.filter(pair => pair !== "")
		.map(pair => {
			const eq = pair.indexOf("=");
			const key = eq === -1 ? pair : pair.slice(0, eq);
			const value = eq === -1 ? "" : pair.slice(eq + 1);
			return createKeyValue({ key: decode(key), value: decode(value) });
		});
	return { base, params };
}

/**
 * Compose the URL-bar display string from a base and its query params. Only enabled,
 * non-empty-key params are mounted. Values are kept raw (not percent-encoded) so the bar
 * stays readable and round-trips with {@link splitUrl}; encoding happens at serialize time.
 */
export function composeUrl(base: string, params: KeyValue[]): string {
	const active = params.filter(p => p.enabled && p.key !== "");
	if (active.length === 0) return base;
	const query = active.map(p => (p.value === "" ? p.key : `${p.key}=${p.value}`)).join("&");
	const separator = base.includes("?") ? "&" : "?";
	return `${base}${separator}${query}`;
}

/**
 * Whether the URL bar can faithfully represent the current query params: composing then
 * re-splitting must yield the same enabled params. Returns false when a value can't survive
 * the readable (un-encoded) round-trip — i.e. it contains a literal `&` that would re-parse
 * as a separator. Such values must be edited in the Query Params table, not the bar.
 */
export function barRoundTrips(url: string, params: KeyValue[]): boolean {
	const active = params.filter(p => p.enabled && p.key !== "");
	if (active.length === 0) return true;
	const back = splitUrl(composeUrl(url, params)).params;
	if (back.length !== active.length) return false;
	return active.every((p, i) => back[i].key === p.key && back[i].value === p.value);
}

/** Merge query params parsed from the URL bar with the disabled rows kept only in the table. */
export function mergeQueryParams(parsed: KeyValue[], existing: KeyValue[]): KeyValue[] {
	return [...parsed, ...existing.filter(p => !p.enabled)];
}

/** Path-param token names in declaration order, de-duplicated. */
export function extractPathParams(url: string): string[] {
	const names: string[] = [];
	for (const match of url.matchAll(PATH_PARAM_RE)) {
		if (!names.includes(match[1])) names.push(match[1]);
	}
	return names;
}

/**
 * Reconcile the stored path-param values against the `:tokens` currently in the URL: keep
 * the value for tokens that still exist, drop stale ones, add fresh rows for new tokens.
 */
export function reconcilePathParams(url: string, stored: KeyValue[]): KeyValue[] {
	return extractPathParams(url).map(
		name => stored.find(p => p.key === name) ?? createKeyValue({ key: name }),
	);
}

/** Substitute `:name` tokens with their (already interpolated) values, percent-encoded. */
export function applyPathParams(url: string, pathParams: KeyValue[]): string {
	return url.replace(PATH_PARAM_RE, (match, name: string) => {
		const param = pathParams.find(p => p.key === name && p.enabled);
		if (!param || param.value === "") return match;
		return encodeURIComponent(param.value);
	});
}
