import { create } from "zustand";
import * as tabsRepo from "@/lib/db/tabs.repo";
import type { TabRow } from "@/lib/db/types";
import { type EditorSnapshot, useActiveRequestStore } from "@/lib/store/active-request.store";
import { createEmptyRequest } from "@/lib/request/model";

interface TabMeta {
	id: string;
	requestId: string | null;
	name: string;
}

interface TabsState {
	workspaceId: string | null;
	tabs: TabMeta[];
	activeTabId: string | null;
	/** Editor snapshot per tab; the active tab's live state lives in the active-request store. */
	stash: Record<string, EditorSnapshot>;
	loadForWorkspace: (workspaceId: string) => Promise<void>;
	openRequest: (requestId: string, name: string, draft: EditorSnapshot["draft"]) => void;
	openLoaded: (snapshot: EditorSnapshot) => void;
	openScratch: () => void;
	switchTo: (tabId: string) => void;
	closeTab: (tabId: string) => void;
	/** Sync the active tab's name/requestId after a save/rename. */
	setActiveMeta: (meta: { name?: string; requestId?: string | null }) => void;
	persistActive: () => void;
}

function emptySnapshot(): EditorSnapshot {
	return { requestId: null, name: "Untitled request", draft: createEmptyRequest(), dirty: false, response: null };
}

function persist(workspaceId: string, tabs: TabMeta[], stash: Record<string, EditorSnapshot>): void {
	tabs.forEach((tab, index) => {
		const snap = stash[tab.id];
		if (!snap) return;
		const row: TabRow = {
			id: tab.id,
			workspaceId,
			requestId: snap.requestId,
			name: snap.name,
			draft: snap.draft,
			order: index,
		};
		void tabsRepo.putTab(row);
	});
}

/** Pull the live editor into the stash for the active tab. */
function snapshotActive(state: TabsState): Record<string, EditorSnapshot> {
	if (!state.activeTabId) return state.stash;
	return { ...state.stash, [state.activeTabId]: useActiveRequestStore.getState().snapshot() };
}

export const useTabsStore = create<TabsState>()((set, get) => ({
	workspaceId: null,
	tabs: [],
	activeTabId: null,
	stash: {},

	loadForWorkspace: async workspaceId => {
		const rows = await tabsRepo.listTabs(workspaceId);
		const tabs: TabMeta[] = rows.map(r => ({ id: r.id, requestId: r.requestId, name: r.name }));
		const stash: Record<string, EditorSnapshot> = {};
		for (const r of rows) {
			stash[r.id] = { requestId: r.requestId, name: r.name, draft: r.draft, dirty: false, response: null };
		}
		if (tabs.length === 0) {
			const id = crypto.randomUUID();
			tabs.push({ id, requestId: null, name: "Untitled request" });
			stash[id] = emptySnapshot();
		}
		const activeTabId = tabs[0].id;
		set({ workspaceId, tabs, stash, activeTabId });
		useActiveRequestStore.getState().hydrate(stash[activeTabId]);
		persist(workspaceId, tabs, stash);
	},

	openRequest: (requestId, name, draft) => {
		const state = get();
		const existing = state.tabs.find(t => t.requestId === requestId);
		if (existing) {
			get().switchTo(existing.id);
			return;
		}
		const stash = snapshotActive(state);
		const id = crypto.randomUUID();
		const tabs = [...state.tabs, { id, requestId, name }];
		const snap: EditorSnapshot = { requestId, name, draft, dirty: false, response: null };
		const nextStash = { ...stash, [id]: snap };
		set({ tabs, activeTabId: id, stash: nextStash });
		useActiveRequestStore.getState().hydrate(snap);
		if (state.workspaceId) persist(state.workspaceId, tabs, nextStash);
	},

	openLoaded: snapshot => {
		const state = get();
		const stash = snapshotActive(state);
		const id = crypto.randomUUID();
		const tabs = [...state.tabs, { id, requestId: snapshot.requestId, name: snapshot.name }];
		const nextStash = { ...stash, [id]: snapshot };
		set({ tabs, activeTabId: id, stash: nextStash });
		useActiveRequestStore.getState().hydrate(snapshot);
		if (state.workspaceId) persist(state.workspaceId, tabs, nextStash);
	},

	openScratch: () => {
		const state = get();
		const stash = snapshotActive(state);
		const id = crypto.randomUUID();
		const tabs = [...state.tabs, { id, requestId: null, name: "Untitled request" }];
		const snap = emptySnapshot();
		const nextStash = { ...stash, [id]: snap };
		set({ tabs, activeTabId: id, stash: nextStash });
		useActiveRequestStore.getState().hydrate(snap);
		if (state.workspaceId) persist(state.workspaceId, tabs, nextStash);
	},

	switchTo: tabId => {
		const state = get();
		if (tabId === state.activeTabId) return;
		const stash = snapshotActive(state);
		set({ activeTabId: tabId, stash });
		useActiveRequestStore.getState().hydrate(stash[tabId] ?? emptySnapshot());
		if (state.workspaceId) persist(state.workspaceId, state.tabs, stash);
	},

	closeTab: tabId => {
		const state = get();
		const stash = snapshotActive(state);
		const index = state.tabs.findIndex(t => t.id === tabId);
		if (index === -1) return;

		const tabs = state.tabs.filter(t => t.id !== tabId);
		const { [tabId]: _removed, ...rest } = stash;
		void tabsRepo.deleteTab(tabId);

		if (tabs.length === 0) {
			const id = crypto.randomUUID();
			tabs.push({ id, requestId: null, name: "Untitled request" });
			rest[id] = emptySnapshot();
		}
		let activeTabId = state.activeTabId;
		if (tabId === state.activeTabId) {
			activeTabId = tabs[Math.min(index, tabs.length - 1)].id;
			useActiveRequestStore.getState().hydrate(rest[activeTabId] ?? emptySnapshot());
		}
		set({ tabs, stash: rest, activeTabId });
		if (state.workspaceId) persist(state.workspaceId, tabs, rest);
	},

	setActiveMeta: meta => {
		const state = get();
		if (!state.activeTabId) return;
		const tabs = state.tabs.map(t =>
			t.id === state.activeTabId
				? { ...t, name: meta.name ?? t.name, requestId: meta.requestId ?? t.requestId }
				: t,
		);
		set({ tabs });
	},

	persistActive: () => {
		const state = get();
		if (!state.workspaceId) return;
		persist(state.workspaceId, state.tabs, snapshotActive(state));
	},
}));
