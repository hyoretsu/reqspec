import { describe, expect, it } from "bun:test";
import { createEmptyRequest, createKeyValue, requestModelSchema } from "@/lib/request/model";

describe("createEmptyRequest", () => {
	it("produces a valid default GET request", () => {
		const req = createEmptyRequest();
		expect(req.method).toBe("GET");
		expect(req.body).toEqual({ type: "none" });
		expect(req.auth).toEqual({ type: "none" });
		expect(requestModelSchema.safeParse(req).success).toBe(true);
	});
});

describe("createKeyValue", () => {
	it("defaults to enabled with empty key/value and a unique id", () => {
		const a = createKeyValue();
		const b = createKeyValue();
		expect(a.enabled).toBe(true);
		expect(a.key).toBe("");
		expect(a.id).not.toBe(b.id);
	});

	it("accepts overrides", () => {
		expect(createKeyValue({ key: "k", value: "v", enabled: false })).toMatchObject({
			key: "k",
			value: "v",
			enabled: false,
		});
	});
});

describe("requestModelSchema", () => {
	it("rejects an invalid method", () => {
		const bad = { ...createEmptyRequest(), method: "FETCH" };
		expect(requestModelSchema.safeParse(bad).success).toBe(false);
	});

	it("rejects an invalid body discriminant", () => {
		const bad = { ...createEmptyRequest(), body: { type: "xml" } };
		expect(requestModelSchema.safeParse(bad).success).toBe(false);
	});

	it("accepts a fully populated request", () => {
		const req = {
			...createEmptyRequest(),
			method: "POST" as const,
			body: { type: "raw" as const, subtype: "json" as const, content: "{}" },
			auth: { type: "bearer" as const, token: "t" },
		};
		expect(requestModelSchema.safeParse(req).success).toBe(true);
	});
});
