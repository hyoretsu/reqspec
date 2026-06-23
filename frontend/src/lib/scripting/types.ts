/** Variable layers a script can read/write, mirroring Postman's scopes. */
export type VarLayer = "environment" | "globals" | "collection" | "local" | "data";

export type VarBag = Record<string, string>;

export interface ScriptRequestView {
	method: string;
	url: string;
	headers: { key: string; value: string }[];
	body: string;
}

export interface ScriptResponseView {
	code: number;
	status: string;
	headers: { key: string; value: string }[];
	body: string;
	responseTime: number;
}

export interface SendRequestInput {
	method?: string;
	url: string;
	headers?: Record<string, string>;
	body?: string;
}

export interface SendRequestResult {
	code: number;
	status: string;
	headers: { key: string; value: string }[];
	body: string;
}

export type SendRequestFn = (input: SendRequestInput) => Promise<SendRequestResult>;

export interface TestResult {
	name: string;
	passed: boolean;
	error?: string;
}

/** A captured `console.*` call from a script run. */
export interface ConsoleLog {
	level: "log" | "info" | "warn" | "error" | "debug";
	args: unknown[];
}

/** Output of a single script execution. */
export interface ScriptRunOutput {
	results: TestResult[];
	logs: ConsoleLog[];
}

/** Everything a script run reads from and writes back to. Mutated in place. */
export interface PmContext {
	request: ScriptRequestView;
	response?: ScriptResponseView;
	vars: Record<VarLayer, VarBag>;
	requestName: string;
	eventName: "prerequest" | "test";
	sendRequest?: SendRequestFn;
}
