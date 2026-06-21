import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_WORKSPACE_ID } from "@/lib/db/types";

export type MobilePane = "collections" | "request" | "response" | "history" | "environments" | "cookies";

interface SessionState {
	activeWorkspaceId: string;
	selectedEnvironmentId: string | null;
	activePane: MobilePane;
	drawerOpen: boolean;
	setActiveWorkspace: (id: string) => void;
	setSelectedEnvironment: (id: string | null) => void;
	setActivePane: (pane: MobilePane) => void;
	setDrawerOpen: (open: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
	persist(
		set => ({
			activeWorkspaceId: DEFAULT_WORKSPACE_ID,
			selectedEnvironmentId: null,
			activePane: "request",
			drawerOpen: false,
			// Switching workspace clears the selected environment (it belongs to a workspace).
			setActiveWorkspace: id => set({ activeWorkspaceId: id, selectedEnvironmentId: null }),
			setSelectedEnvironment: id => set({ selectedEnvironmentId: id }),
			setActivePane: pane => set({ activePane: pane }),
			setDrawerOpen: open => set({ drawerOpen: open }),
		}),
		{
			name: "reqspec-session",
			partialize: state => ({
				activeWorkspaceId: state.activeWorkspaceId,
				selectedEnvironmentId: state.selectedEnvironmentId,
			}),
		},
	),
);
