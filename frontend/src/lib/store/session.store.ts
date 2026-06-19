import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MobilePane = "collections" | "request" | "response" | "history" | "environments";

interface SessionState {
	selectedEnvironmentId: string | null;
	activePane: MobilePane;
	drawerOpen: boolean;
	setSelectedEnvironment: (id: string | null) => void;
	setActivePane: (pane: MobilePane) => void;
	setDrawerOpen: (open: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
	persist(
		set => ({
			selectedEnvironmentId: null,
			activePane: "request",
			drawerOpen: false,
			setSelectedEnvironment: id => set({ selectedEnvironmentId: id }),
			setActivePane: pane => set({ activePane: pane }),
			setDrawerOpen: open => set({ drawerOpen: open }),
		}),
		{
			name: "reqspec-session",
			partialize: state => ({ selectedEnvironmentId: state.selectedEnvironmentId }),
		},
	),
);
