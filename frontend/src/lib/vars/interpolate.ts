import type { BodyDescriptor, KeyValue, RequestModel } from "@/lib/request/model";

export interface VarScope {
	env: Record<string, string>;
	globals: Record<string, string>;
}

const VAR_PATTERN = /\{\{\s*([^{}\s]+)\s*\}\}/g;

/**
 * Resolve `{{var}}` tokens in a template. Precedence: env > globals.
 * Unknown variables are left literal. Single pass — resolved values are not re-expanded.
 */
export function interpolate(template: string, scope: VarScope): string {
	return template.replace(VAR_PATTERN, (match, name: string) => {
		if (name in scope.env) return scope.env[name];
		if (name in scope.globals) return scope.globals[name];
		return match;
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
		default:
			return body;
	}
}

/** Apply variable interpolation across every field of a request. Pure. */
export function interpolateRequest(req: RequestModel, scope: VarScope): RequestModel {
	const auth = req.auth;
	const interpolatedAuth =
		auth.type === "basic"
			? {
					...auth,
					username: interpolate(auth.username, scope),
					password: interpolate(auth.password, scope),
				}
			: auth.type === "bearer"
				? { ...auth, token: interpolate(auth.token, scope) }
				: auth;

	return {
		...req,
		url: interpolate(req.url, scope),
		params: interpolateKeyValues(req.params, scope),
		headers: interpolateKeyValues(req.headers, scope),
		body: interpolateBody(req.body, scope),
		auth: interpolatedAuth,
	};
}
