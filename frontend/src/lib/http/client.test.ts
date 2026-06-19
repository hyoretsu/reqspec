import { describe, expect, it } from "bun:test";
import { sendWith } from "@/lib/http/client";
import type { HttpAdapter, RawHttpResponse, SerializedRequest } from "@/lib/http/types";
import { createEmptyRequest } from "@/lib/request/model";
import type { VarScope } from "@/lib/vars/interpolate";

const scope: VarScope = { env: { host: "api.example.com" }, globals: {} };

function stubAdapter(capture: { req?: SerializedRequest }): HttpAdapter {
	return async req => {
		capture.req = req;
		const body: RawHttpResponse = {
			status: 201,
			statusText: "Created",
			headers: [["content-type", "application/json"]],
			bodyBytes: new TextEncoder().encode('{"ok":true}'),
			contentType: "application/json",
		};
		return body;
	};
}

describe("sendWith", () => {
	it("interpolates, serializes, runs the adapter and normalizes", async () => {
		const capture: { req?: SerializedRequest } = {};
		const req = createEmptyRequest();
		req.method = "POST";
		req.url = "https://{{host}}/users";

		const res = await sendWith(stubAdapter(capture), req, scope);

		expect(capture.req?.url).toBe("https://api.example.com/users");
		expect(capture.req?.method).toBe("POST");
		expect(res.status).toBe(201);
		expect(res.bodyText).toBe('{"ok":true}');
		expect(res.timeMs).toBeGreaterThanOrEqual(0);
	});

	it("surfaces adapter error fields", async () => {
		const errorAdapter: HttpAdapter = async () => ({
			status: 0,
			statusText: "",
			headers: [],
			bodyBytes: new Uint8Array(),
			contentType: undefined,
			error: "network down",
		});
		const res = await sendWith(errorAdapter, createEmptyRequest(), scope);
		expect(res.error).toBe("network down");
		expect(res.status).toBe(0);
	});
});
