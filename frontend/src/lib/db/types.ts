import type { NormalizedResponse } from "@/lib/http/types";
import type { HttpMethod, KeyValue, RequestModel } from "@/lib/request/model";

/** Variables are stored as KeyValue (id-bearing) so editors can reuse KeyValueEditor. */
export type VariableRow = KeyValue;

export interface CollectionRow {
	id: string;
	name: string;
	createdAt: number;
	order: number;
}

export interface FolderRow {
	id: string;
	collectionId: string;
	parentFolderId: string | null;
	name: string;
	order: number;
}

export interface RequestRow {
	id: string;
	collectionId: string;
	folderId: string | null;
	name: string;
	order: number;
	updatedAt: number;
	request: RequestModel;
}

export interface EnvironmentRow {
	id: string;
	name: string;
	createdAt: number;
	variables: VariableRow[];
}

export const GLOBALS_ID = "globals";

export interface GlobalsRow {
	id: typeof GLOBALS_ID;
	variables: VariableRow[];
}

export interface HistoryRow {
	id: string;
	createdAt: number;
	name: string;
	method: HttpMethod;
	url: string;
	status: number;
	request: RequestModel;
	response: NormalizedResponse;
}
