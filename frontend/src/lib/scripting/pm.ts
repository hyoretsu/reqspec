import { AssertionError, expect } from "@/lib/scripting/expect";
import type { PmContext, SendRequestInput, TestResult, VarBag, VarLayer } from "@/lib/scripting/types";

/** A single variable scope binding (environment/globals/collection/...). */
function varScope(bag: VarBag) {
	return {
		get: (key: string): string | undefined => (key in bag ? bag[key] : undefined),
		set: (key: string, value: unknown): void => {
			bag[key] = String(value);
		},
		unset: (key: string): void => {
			delete bag[key];
		},
		has: (key: string): boolean => key in bag,
		clear: (): void => {
			for (const key of Object.keys(bag)) delete bag[key];
		},
		toObject: (): VarBag => ({ ...bag }),
	};
}

/** Read-with-precedence merged view: local > data > environment > collection > globals. */
const READ_ORDER: VarLayer[] = ["local", "data", "environment", "collection", "globals"];

function headerList(headers: { key: string; value: string }[]) {
	const find = (name: string) => headers.find(h => h.key.toLowerCase() === name.toLowerCase());
	return {
		get: (name: string): string | undefined => find(name)?.value,
		has: (name: string): boolean => find(name) !== undefined,
		add: (header: { key: string; value: string }): void => {
			headers.push({ key: header.key, value: header.value });
		},
		upsert: (header: { key: string; value: string }): void => {
			const existing = find(header.key);
			if (existing) existing.value = header.value;
			else headers.push({ key: header.key, value: header.value });
		},
		remove: (name: string): void => {
			const idx = headers.findIndex(h => h.key.toLowerCase() === name.toLowerCase());
			if (idx !== -1) headers.splice(idx, 1);
		},
	};
}

function responseApi(ctx: PmContext) {
	const res = ctx.response;
	if (!res) return undefined;
	const headers = headerList(res.headers);
	return {
		code: res.code,
		status: res.status,
		responseTime: res.responseTime,
		text: () => res.body,
		json: () => JSON.parse(res.body),
		headers,
		to: {
			have: {
				status: (expected: number | string): void => {
					if (typeof expected === "number") expect(res.code).to.equal(expected);
					else expect(res.status).to.equal(expected);
				},
				header: (name: string): void => {
					expect(headers.has(name)).to.equal(true);
				},
			},
			be: {
				get json(): void {
					JSON.parse(res.body);
					return undefined;
				},
			},
		},
	};
}

/**
 * Build the `pm` API plus a results collector over a mutable {@link PmContext}.
 * All variable/request mutations happen in place on `ctx`, so the caller reads the
 * updated state back from `ctx` after the script runs. Pure (no I/O of its own —
 * `pm.sendRequest` delegates to the injected `ctx.sendRequest`).
 */
export function createPm(ctx: PmContext): { pm: Record<string, unknown>; results: TestResult[] } {
	const results: TestResult[] = [];

	const variables = {
		get: (key: string): string | undefined => {
			for (const layer of READ_ORDER) {
				if (key in ctx.vars[layer]) return ctx.vars[layer][key];
			}
			return undefined;
		},
		has: (key: string): boolean => READ_ORDER.some(layer => key in ctx.vars[layer]),
		set: (key: string, value: unknown): void => {
			ctx.vars.local[key] = String(value);
		},
	};

	const pm: Record<string, unknown> = {
		environment: varScope(ctx.vars.environment),
		globals: varScope(ctx.vars.globals),
		collectionVariables: varScope(ctx.vars.collection),
		iterationData: varScope(ctx.vars.data),
		variables,
		info: { requestName: ctx.requestName, eventName: ctx.eventName },
		expect,
		request: {
			get method() {
				return ctx.request.method;
			},
			get url() {
				return ctx.request.url;
			},
			set url(value: string) {
				ctx.request.url = value;
			},
			get body() {
				return ctx.request.body;
			},
			set body(value: string) {
				ctx.request.body = value;
			},
			headers: headerList(ctx.request.headers),
		},
		response: responseApi(ctx),
		test: (name: string, fn: () => void): void => {
			try {
				fn();
				results.push({ name, passed: true });
			} catch (err) {
				const message = err instanceof AssertionError || err instanceof Error ? err.message : String(err);
				results.push({ name, passed: false, error: message });
			}
		},
		sendRequest: async (
			input: SendRequestInput | string,
			callback?: (err: Error | null, res: unknown) => void,
		): Promise<unknown> => {
			if (!ctx.sendRequest) throw new Error("pm.sendRequest is not available in this context");
			const normalized: SendRequestInput = typeof input === "string" ? { url: input } : input;
			try {
				const raw = await ctx.sendRequest(normalized);
				const wrapped = {
					code: raw.code,
					status: raw.status,
					headers: raw.headers,
					text: () => raw.body,
					json: () => JSON.parse(raw.body),
				};
				callback?.(null, wrapped);
				return wrapped;
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				if (callback) {
					callback(error, null);
					return null;
				}
				throw error;
			}
		},
	};

	return { pm, results };
}
