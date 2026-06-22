import { describe, expect, it } from "bun:test";
import { setFile } from "@/lib/files/file-store";
import { serializeRequest } from "@/lib/http/serialize";
import { createEmptyRequest, type KeyValue } from "@/lib/request/model";

function kv(key: string, value: string, enabled = true): KeyValue {
	return { id: crypto.randomUUID(), key, value, enabled };
}

describe("serializeRequest", () => {
	it("appends enabled params as a query string", () => {
		const req = createEmptyRequest();
		req.url = "https://x.com/a";
		req.params = [kv("q", "hi there"), kv("skip", "x", false), kv("", "y")];
		expect(serializeRequest(req).url).toBe("https://x.com/a?q=hi%20there");
	});

	it("uses & when the url already has a query", () => {
		const req = createEmptyRequest();
		req.url = "https://x.com/a?z=1";
		req.params = [kv("q", "2")];
		expect(serializeRequest(req).url).toBe("https://x.com/a?z=1&q=2");
	});

	it("substitutes path params before appending the query", () => {
		const req = createEmptyRequest();
		req.url = "https://x.com/users/:id/posts/:slug";
		req.pathParams = [kv("id", "42"), kv("slug", "")];
		req.params = [kv("page", "2")];
		expect(serializeRequest(req).url).toBe("https://x.com/users/42/posts/:slug?page=2");
	});

	it("drops disabled headers", () => {
		const req = createEmptyRequest();
		req.headers = [kv("A", "1"), kv("B", "2", false)];
		expect(serializeRequest(req).headers).toEqual({ A: "1" });
	});

	it("encodes basic auth as base64", () => {
		const req = createEmptyRequest();
		req.auth = { type: "basic", username: "user", password: "pass" };
		expect(serializeRequest(req).headers.Authorization).toBe(`Basic ${btoa("user:pass")}`);
	});

	it("sets bearer auth header", () => {
		const req = createEmptyRequest();
		req.auth = { type: "bearer", token: "abc" };
		expect(serializeRequest(req).headers.Authorization).toBe("Bearer abc");
	});

	it("adds an API key to a header", () => {
		const req = createEmptyRequest();
		req.auth = { type: "apikey", key: "X-API-Key", value: "secret", addTo: "header" };
		expect(serializeRequest(req).headers["X-API-Key"]).toBe("secret");
	});

	it("adds an API key to the query string", () => {
		const req = createEmptyRequest();
		req.url = "https://x.com/a";
		req.auth = { type: "apikey", key: "api_key", value: "s e", addTo: "query" };
		expect(serializeRequest(req).url).toBe("https://x.com/a?api_key=s%20e");
	});

	it("sends an OAuth2 access token as a Bearer header", () => {
		const req = createEmptyRequest();
		req.auth = {
			type: "oauth2",
			grantType: "token",
			accessToken: "tok",
			tokenUrl: "",
			clientId: "",
			clientSecret: "",
			username: "",
			password: "",
			scope: "",
		};
		expect(serializeRequest(req).headers.Authorization).toBe("Bearer tok");
	});

	it("defaults JSON content-type for raw json body", () => {
		const req = createEmptyRequest();
		req.body = { type: "raw", subtype: "json", content: "{}" };
		const out = serializeRequest(req);
		expect(out.body).toBe("{}");
		expect(out.headers["Content-Type"]).toBe("application/json");
	});

	it("does not override an explicit content-type", () => {
		const req = createEmptyRequest();
		req.headers = [kv("content-type", "application/ld+json")];
		req.body = { type: "raw", subtype: "json", content: "{}" };
		expect(serializeRequest(req).headers["content-type"]).toBe("application/ld+json");
	});

	it("serializes urlencoded bodies", () => {
		const req = createEmptyRequest();
		req.body = { type: "urlencoded", fields: [kv("a", "1"), kv("b", "x y"), kv("c", "z", false)] };
		const out = serializeRequest(req);
		expect(out.body).toBe("a=1&b=x%20y");
		expect(out.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
	});

	it("builds FormData for form-data bodies without forcing content-type", () => {
		const req = createEmptyRequest();
		req.body = { type: "form-data", fields: [kv("file", "data")] };
		const out = serializeRequest(req);
		expect(out.body).toBeInstanceOf(FormData);
		expect((out.body as FormData).get("file")).toBe("data");
		expect(out.headers["Content-Type"]).toBeUndefined();
	});

	it("serializes a GraphQL body as JSON with parsed variables", () => {
		const req = createEmptyRequest();
		req.body = { type: "graphql", query: "query { me }", variables: '{"id":1}' };
		const out = serializeRequest(req);
		expect(out.headers["Content-Type"]).toBe("application/json");
		expect(JSON.parse(out.body as string)).toEqual({ query: "query { me }", variables: { id: 1 } });
	});

	it("defaults GraphQL variables to {} when blank or invalid", () => {
		const req = createEmptyRequest();
		req.body = { type: "graphql", query: "q", variables: "not json" };
		expect(JSON.parse(serializeRequest(req).body as string).variables).toEqual({});
	});

	it("appends a picked file to form-data using its row id", () => {
		const file = new File(["bytes"], "upload.bin", { type: "application/octet-stream" });
		setFile("row-1", file);
		const req = createEmptyRequest();
		req.body = {
			type: "form-data",
			fields: [{ id: "row-1", key: "doc", value: "", enabled: true, kind: "file", fileName: "upload.bin" }],
		};
		const out = serializeRequest(req);
		expect(out.body).toBeInstanceOf(FormData);
		expect((out.body as FormData).get("doc")).toBeInstanceOf(File);
		expect(((out.body as FormData).get("doc") as File).name).toBe("upload.bin");
	});

	it("skips a file row whose file is no longer in the store", () => {
		const req = createEmptyRequest();
		req.body = {
			type: "form-data",
			fields: [{ id: "absent", key: "doc", value: "", enabled: true, kind: "file" }],
		};
		expect([...(serializeRequest(req).body as FormData).keys()]).toEqual([]);
	});

	it("sends a binary body as the picked file with its content-type", () => {
		const file = new File(["raw"], "image.png", { type: "image/png" });
		setFile("bin-1", file);
		const req = createEmptyRequest();
		req.body = { type: "binary", fileId: "bin-1", fileName: "image.png", contentType: "image/png" };
		const out = serializeRequest(req);
		expect(out.body).toBe(file);
		expect(out.headers["Content-Type"]).toBe("image/png");
	});

	it("falls back to the file's own MIME type when binary content-type is blank", () => {
		const file = new File(["raw"], "image.png", { type: "image/png" });
		setFile("bin-2", file);
		const req = createEmptyRequest();
		req.body = { type: "binary", fileId: "bin-2", fileName: "image.png", contentType: "" };
		expect(serializeRequest(req).headers["Content-Type"]).toBe("image/png");
	});

	it("leaves a binary body undefined when no file is picked", () => {
		const req = createEmptyRequest();
		req.body = { type: "binary", fileId: "bin-missing", fileName: "", contentType: "" };
		const out = serializeRequest(req);
		expect(out.body).toBeUndefined();
		expect(out.headers["Content-Type"]).toBeUndefined();
	});

	it("leaves body undefined for none", () => {
		expect(serializeRequest(createEmptyRequest()).body).toBeUndefined();
	});
});
