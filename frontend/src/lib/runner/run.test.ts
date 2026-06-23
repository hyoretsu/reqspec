import { describe, expect, test } from "bun:test";
import type { NormalizedResponse } from "@/lib/http/types";
import { createEmptyRequest, type RequestModel } from "@/lib/request/model";
import {
	type RunItem,
	type RunSendFn,
	resolveIterations,
	runCollection,
	serializeReport,
} from "@/lib/runner/run";
import type { TestResult } from "@/lib/scripting/types";
import type { VarScope } from "@/lib/vars/interpolate";

function item(id: string, over: Partial<RequestModel> = {}): RunItem {
	return {
		id,
		name: `req-${id}`,
		request: { ...createEmptyRequest(), url: `https://x.test/${id}`, ...over },
	};
}

function response(over: Partial<NormalizedResponse> = {}): NormalizedResponse {
	return {
		status: 200,
		statusText: "OK",
		headers: [],
		bodyText: "",
		bodyBytes: 0,
		contentType: undefined,
		cookies: [],
		timeMs: 7,
		...over,
	};
}

const tests = (...specs: Array<[string, boolean]>): TestResult[] =>
	specs.map(([name, passed]) => ({ name, passed }));

describe("resolveIterations", () => {
	test("uses explicit iterations, floored and clamped to >= 1", () => {
		expect(resolveIterations({ iterations: 3 })).toBe(3);
		expect(resolveIterations({ iterations: 2.9 })).toBe(2);
		expect(resolveIterations({ iterations: 0 })).toBe(1);
	});

	test("falls back to data length, or 1 when no data", () => {
		expect(resolveIterations({ data: [{ a: "1" }, { a: "2" }] })).toBe(2);
		expect(resolveIterations({})).toBe(1);
		expect(resolveIterations({ data: [] })).toBe(1);
	});
});

describe("runCollection", () => {
	test("runs every item once and aggregates test pass/fail", async () => {
		const send: RunSendFn = async (req) =>
			response({
				tests: req.url.endsWith("a")
					? tests(["ok", true], ["bad", false])
					: tests(["ok", true]),
			});
		const report = await runCollection([item("a"), item("b")], {}, { send });

		expect(report.iterations).toBe(1);
		expect(report.requestCount).toBe(2);
		expect(report.results).toHaveLength(2);
		expect(report.totalTests).toBe(3);
		expect(report.passedTests).toBe(2);
		expect(report.failedTests).toBe(1);
		expect(report.failedRequests).toBe(1);
		expect(report.aborted).toBe(false);
		expect(report.durationMs).toBeGreaterThanOrEqual(0);
		expect(report.results[0]).toMatchObject({
			iteration: 1,
			requestId: "a",
			name: "req-a",
			status: 200,
			statusText: "OK",
			timeMs: 7,
		});
	});

	test("feeds per-iteration data rows and reports iteration numbers", async () => {
		const seen: string[] = [];
		const send: RunSendFn = async (_req, scope) => {
			seen.push(scope.data.user ?? "");
			return response();
		};
		const report = await runCollection(
			[item("a")],
			{ data: [{ user: "u1" }, { user: "u2" }] },
			{ send },
		);

		expect(report.iterations).toBe(2);
		expect(seen).toEqual(["u1", "u2"]);
		expect(report.results.map((r) => r.iteration)).toEqual([1, 2]);
	});

	test("wraps data rows when iterations exceed row count", async () => {
		const seen: string[] = [];
		const send: RunSendFn = async (_req, scope) => {
			seen.push(scope.data.user ?? "");
			return response();
		};
		await runCollection(
			[item("a")],
			{ iterations: 3, data: [{ user: "u1" }, { user: "u2" }] },
			{ send },
		);
		expect(seen).toEqual(["u1", "u2", "u1"]);
	});

	test("merges baseScope and carries script var writes forward while preserving data", async () => {
		const captured: VarScope[] = [];
		const send: RunSendFn = async (_req, scope) => {
			captured.push(scope);
			// First request writes an env var via scriptVars; second should see it.
			return response({
				scriptVars: {
					...scope,
					environment: { ...scope.environment, token: "abc" },
				},
			});
		};
		await runCollection(
			[item("a"), item("b")],
			{ data: [{ user: "u1" }] },
			{
				send,
				baseScope: {
					local: {},
					data: {},
					environment: { base: "1" },
					collection: {},
					globals: {},
				},
			},
		);

		expect(captured[0].environment).toEqual({ base: "1" });
		expect(captured[0].data).toEqual({ user: "u1" });
		expect(captured[1].environment).toEqual({ base: "1", token: "abc" });
		expect(captured[1].data).toEqual({ user: "u1" });
	});

	test("captures send errors as failed result rows", async () => {
		const send: RunSendFn = async (req) => {
			if (req.url.endsWith("a")) throw new Error("boom");
			return response();
		};
		const report = await runCollection([item("a"), item("b")], {}, { send });

		expect(report.results[0]).toMatchObject({
			requestId: "a",
			error: "boom",
			timeMs: 0,
			tests: [],
		});
		expect(report.failedRequests).toBe(1);
		expect(report.results[1].error).toBeUndefined();
	});

	test("stringifies non-Error throws", async () => {
		const send: RunSendFn = async () => {
			throw "weird";
		};
		const report = await runCollection([item("a")], {}, { send });
		expect(report.results[0].error).toBe("weird");
	});

	test("counts a request with a response error as failed", async () => {
		const send: RunSendFn = async () =>
			response({ error: "network", status: 0, statusText: "" });
		const report = await runCollection([item("a")], {}, { send });
		expect(report.failedRequests).toBe(1);
	});

	test("fires onResult for each completed request", async () => {
		const send: RunSendFn = async () => response();
		const ids: string[] = [];
		await runCollection(
			[item("a"), item("b")],
			{},
			{ send, onResult: (r) => ids.push(r.requestId) },
		);
		expect(ids).toEqual(["a", "b"]);
	});

	test("stops early when the signal is aborted", async () => {
		const signal = { aborted: false };
		const send: RunSendFn = async () => {
			signal.aborted = true;
			return response();
		};
		const report = await runCollection(
			[item("a"), item("b"), item("c")],
			{},
			{ send, signal },
		);
		expect(report.results).toHaveLength(1);
		expect(report.aborted).toBe(true);
	});

	test("applies the configured delay before each request after the first", async () => {
		const delays: number[] = [];
		const send: RunSendFn = async () => response();
		await runCollection(
			[item("a"), item("b")],
			{ iterations: 2, delayMs: 50 },
			{
				send,
				sleep: async (ms) => {
					delays.push(ms);
				},
			},
		);
		// 4 requests total → 3 delays (all but the very first).
		expect(delays).toEqual([50, 50, 50]);
	});

	test("does not sleep when delay is zero or unset", async () => {
		let slept = false;
		const send: RunSendFn = async () => response();
		await runCollection(
			[item("a"), item("b")],
			{ delayMs: 0 },
			{
				send,
				sleep: async () => {
					slept = true;
				},
			},
		);
		expect(slept).toBe(false);
	});

	test("real timer path resolves without injected sleep", async () => {
		const send: RunSendFn = async () => response();
		const report = await runCollection(
			[item("a"), item("b")],
			{ delayMs: 1 },
			{ send },
		);
		expect(report.results).toHaveLength(2);
	});
});

describe("serializeReport", () => {
	test("produces pretty JSON", async () => {
		const send: RunSendFn = async () =>
			response({ tests: tests(["ok", true]) });
		const report = await runCollection([item("a")], {}, { send });
		const json = serializeReport(report);
		expect(JSON.parse(json).passedTests).toBe(1);
		expect(json).toContain("\n");
	});
});
