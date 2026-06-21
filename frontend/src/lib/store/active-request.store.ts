import { create } from "zustand";
import type { NormalizedResponse } from "@/lib/http/types";
import { createEmptyRequest, type RequestModel } from "@/lib/request/model";

/** A serializable snapshot of the editor, used to swap tabs in/out. */
export interface EditorSnapshot {
	requestId: string | null;
	name: string;
	draft: RequestModel;
	dirty: boolean;
	response: NormalizedResponse | null;
}

interface ActiveRequestState {
	/** id of the persisted request being edited, or null for an unsaved scratch request. */
	requestId: string | null;
	name: string;
	draft: RequestModel;
	dirty: boolean;
	response: NormalizedResponse | null;
	isSending: boolean;
	open: (requestId: string, name: string, draft: RequestModel) => void;
	/** Load a request model as an unsaved scratch draft (e.g. re-opening from history). */
	loadDraft: (name: string, draft: RequestModel) => void;
	/** Replace the whole editor with a snapshot (tab switching). */
	hydrate: (snapshot: EditorSnapshot) => void;
	snapshot: () => EditorSnapshot;
	reset: () => void;
	setDraft: (draft: RequestModel) => void;
	patchDraft: (patch: Partial<RequestModel>) => void;
	markSaved: () => void;
	setResponse: (response: NormalizedResponse | null) => void;
	setSending: (isSending: boolean) => void;
}

export const useActiveRequestStore = create<ActiveRequestState>()((set, get) => ({
	requestId: null,
	name: "Untitled request",
	draft: createEmptyRequest(),
	dirty: false,
	response: null,
	isSending: false,
	open: (requestId, name, draft) => set({ requestId, name, draft, dirty: false, response: null }),
	loadDraft: (name, draft) => set({ requestId: null, name, draft, dirty: false, response: null }),
	hydrate: snapshot => set({ ...snapshot, isSending: false }),
	snapshot: () => {
		const { requestId, name, draft, dirty, response } = get();
		return { requestId, name, draft, dirty, response };
	},
	reset: () =>
		set({
			requestId: null,
			name: "Untitled request",
			draft: createEmptyRequest(),
			dirty: false,
			response: null,
		}),
	setDraft: draft => set({ draft, dirty: true }),
	patchDraft: patch => set(state => ({ draft: { ...state.draft, ...patch }, dirty: true })),
	markSaved: () => set({ dirty: false }),
	setResponse: response => set({ response }),
	setSending: isSending => set({ isSending }),
}));
