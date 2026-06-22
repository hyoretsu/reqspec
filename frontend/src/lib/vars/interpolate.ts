import type { BodyDescriptor, KeyValue, RequestModel } from "@/lib/request/model";
import { resolveDynamic } from "@/lib/vars/dynamic";

export interface VarScope {
	local: Record<string, string>;
	data: Record<string, string>;
	environment: Record<string, string>;
	collection: Record<string, string>;
	globals: Record<string, string>;
}

const VAR_PATTERN = /\{\{\s*([^{}\s]+)\s*\}\}/g;

/** Highest → lowest precedence. */
const LAYER_ORDER: (keyof VarScope)[] = ["local", "data", "environment", "collection", "globals"];

/**
 * Resolve `{{var}}` tokens. Precedence: local > data > environment > collection > global,
 * then `{{$dynamic}}` variables. Unknown tokens are left literal. Single pass — resolved
 * values are not re-expanded.
 */
export function interpolate(template: string, scope: VarScope): string {
	return template.replace(VAR_PATTERN, (match, name: string) => {
		for (const layer of LAYER_ORDER) {
			if (name in scope[layer]) return scope[layer][name];
		}
		const dynamic = resolveDynamic(name);
		return dynamic ?? match;
	});
}

function interpolateKeyValues(items: KeyValue[], scope: VarScope): KeyValue[] {
	return items.map(item => ({
		...item,
		key: interpolate(item.key, scope),
		value: interpolate(item.value, scope),
	}));
}

function interpolateBody(body: BodyDescriptor, scope: VarScope): BodyDescriptor {
	switch (body.type) {
		case "raw":
			return { ...body, content: interpolate(body.content, scope) };
		case "form-data":
		case "urlencoded":
			return { ...body, fields: interpolateKeyValues(body.fields, scope) };
		case "graphql":
			return {
				...body,
				query: interpolate(body.query, scope),
				variables: interpolate(body.variables, scope),
			};
		default:
			return body;
	}
}

function interpolateAuth(auth: RequestModel["auth"], scope: VarScope): RequestModel["auth"] {
	const t = (s: string) => interpolate(s, scope);
	switch (auth.type) {
		case "basic":
			return { ...auth, username: t(auth.username), password: t(auth.password) };
		case "bearer":
			return { ...auth, token: t(auth.token) };
		case "apikey":
			return { ...auth, key: t(auth.key), value: t(auth.value) };
		case "awsv4":
			return {
				...auth,
				accessKeyId: t(auth.accessKeyId),
				secretAccessKey: t(auth.secretAccessKey),
				region: t(auth.region),
				service: t(auth.service),
				sessionToken: t(auth.sessionToken),
			};
		case "oauth2":
			return { ...auth, accessToken: t(auth.accessToken) };
		default:
			return auth;
	}
}

/** Apply variable interpolation across every field of a request. Pure. */
export function interpolateRequest(req: RequestModel, scope: VarScope): RequestModel {
	const interpolatedAuth = interpolateAuth(req.auth, scope);

	return {
		...req,
		url: interpolate(req.url, scope),
		params: interpolateKeyValues(req.params, scope),
		headers: interpolateKeyValues(req.headers, scope),
		body: interpolateBody(req.body, scope),
		auth: interpolatedAuth,
	};
}
