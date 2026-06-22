import { describe, expect, it } from "bun:test";
import {
	type BodyDescriptor,
	type BodyType,
	createEmptyRequest,
	createKeyValue,
	requestModelSchema,
	switchVariant,
} from "@/lib/request/model";

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

	it("accepts stashed body/auth drafts", () => {
		const req = {
			...createEmptyRequest(),
			bodyDrafts: { raw: { type: "raw" as const, subtype: "json" as const, content: "{}" } },
			authDrafts: { bearer: { type: "bearer" as const, token: "t" } },
		};
		expect(requestModelSchema.safeParse(req).success).toBe(true);
	});
});

describe("switchVariant", () => {
	const defaultBody = (type: BodyType): BodyDescriptor => {
		switch (type) {
			case "raw":
				return { type: "raw", subtype: "json", content: "" };
			case "form-data":
				return { type: "form-data", fields: [] };
			default:
				return { type: "none" };
		}
	};

	it("stashes the outgoing variant and defaults a fresh incoming one", () => {
		const current: BodyDescriptor = { type: "raw", subtype: "json", content: '{"a":1}' };
		const { value, drafts } = switchVariant(current, "form-data", undefined, defaultBody);
		expect(value).toEqual({ type: "form-data", fields: [] });
		expect(drafts.raw).toEqual(current);
	});

	it("restores a previously stashed variant instead of defaulting", () => {
		const stashed: BodyDescriptor = { type: "raw", subtype: "json", content: '{"a":1}' };
		const current: BodyDescriptor = { type: "form-data", fields: [] };
		const { value } = switchVariant(current, "raw", { raw: stashed }, defaultBody);
		expect(value).toEqual(stashed);
	});

	it("round-trips without losing data (raw → form-data → raw)", () => {
		const raw: BodyDescriptor = { type: "raw", subtype: "json", content: '{"keep":true}' };
		const step1 = switchVariant(raw, "form-data", undefined, defaultBody);
		const step2 = switchVariant(step1.value, "raw", step1.drafts, defaultBody);
		expect(step2.value).toEqual(raw);
	});
});
