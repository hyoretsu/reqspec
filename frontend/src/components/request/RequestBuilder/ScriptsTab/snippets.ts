export interface Snippet {
	label: string;
	code: string;
}

/** Common pre-request script snippets, appended to the editor on pick. */
export const PRE_REQUEST_SNIPPETS: Snippet[] = [
	{ label: "Set an environment variable", code: 'pm.environment.set("key", "value");' },
	{ label: "Get a variable", code: 'const value = pm.variables.get("key");' },
	{ label: "Add a header", code: 'pm.request.headers.add({ key: "X-Header", value: "value" });' },
	{ label: "Send a request", code: 'const res = await pm.sendRequest("https://example.com");\nconsole.log(res.json());' },
];

/** Common test script snippets, appended to the editor on pick. */
export const TEST_SNIPPETS: Snippet[] = [
	{ label: "Status code is 200", code: 'pm.test("Status code is 200", () => {\n\tpm.response.to.have.status(200);\n});' },
	{
		label: "Body matches JSON value",
		code: 'pm.test("Body matches", () => {\n\tpm.expect(pm.response.json().id).to.equal(1);\n});',
	},
	{
		label: "Response time is acceptable",
		code: 'pm.test("Response is fast", () => {\n\tpm.expect(pm.response.responseTime).to.be.below(500);\n});',
	},
	{ label: "Has a header", code: 'pm.test("Has Content-Type", () => {\n\tpm.response.to.have.header("Content-Type");\n});' },
	{ label: "Save a value for later", code: 'pm.environment.set("token", pm.response.json().token);' },
];
