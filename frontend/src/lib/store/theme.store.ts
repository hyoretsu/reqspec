import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeState {
	preference: ThemePreference;
	setPreference: (preference: ThemePreference) => void;
}

function systemPrefersDark(): boolean {
	return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveDark(preference: ThemePreference): boolean {
	if (preference === "system") return systemPrefersDark();
	return preference === "dark";
}

/** Apply the `.dark` class on <html> for the given preference. */
export function applyTheme(preference: ThemePreference): void {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", resolveDark(preference));
}

export const useThemeStore = create<ThemeState>()(
	persist(
		set => ({
			preference: "system",
			setPreference: preference => {
				applyTheme(preference);
				set({ preference });
			},
		}),
		{
			name: "reqspec-theme",
			onRehydrateStorage: () => state => {
				if (state) applyTheme(state.preference);
			},
		},
	),
);
