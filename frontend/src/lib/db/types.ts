import type { NormalizedResponse } from "@/lib/http/types";
import type { HttpMethod, KeyValue, RequestModel } from "@/lib/request/model";

/** Variables are stored as KeyValue (id-bearing) so editors can reuse KeyValueEditor. */
export type VariableRow = KeyValue;

export const DEFAULT_WORKSPACE_ID = "default";

export interface WorkspaceRow {
	id: string;
	name: string;
	createdAt: number;
	order: number;
}

export interface CollectionRow {
	id: string;
	workspaceId: string;
	name: string;
	createdAt: number;
	order: number;
	variables?: VariableRow[];
}

export interface CookieRow {
	id: string;
	domain: string;
	path: string;
	name: string;
	value: string;
	expires: number | null;
	secure: boolean;
	httpOnly: boolean;
	sameSite: string | null;
	createdAt: number;
}

export interface FolderRow {
	id: string;
	collectionId: string;
	parentFolderId: string | null;
	name: string;
	order: number;
}

export interface SavedExample {
	id: string;
	name: string;
	createdAt: number;
	request: RequestModel;
	response: NormalizedResponse;
}

export interface RequestRow {
	id: string;
	collectionId: string;
	folderId: string | null;
	name: string;
	order: number;
	updatedAt: number;
	request: RequestModel;
	description?: string;
	examples?: SavedExample[];
}

export interface EnvironmentRow {
	id: string;
	workspaceId: string;
	name: string;
	createdAt: number;
	variables: VariableRow[];
}

/** A persisted open editor tab (restored on reload). */
export interface TabRow {
	id: string;
	workspaceId: string;
	/** Saved request being edited, or null for an unsaved scratch tab. */
	requestId: string | null;
	name: string;
	draft: RequestModel;
	order: number;
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
