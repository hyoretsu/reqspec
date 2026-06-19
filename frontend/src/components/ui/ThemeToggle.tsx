import { IconButton } from "@/components/ui/IconButton";
import { type ThemePreference, useThemeStore } from "@/lib/store/theme.store";

const NEXT: Record<ThemePreference, ThemePreference> = {
	light: "dark",
	dark: "system",
	system: "light",
};

const ICON: Record<ThemePreference, string> = {
	light: "☀️",
	dark: "🌙",
	system: "🖥️",
};

export function ThemeToggle() {
	const preference = useThemeStore(state => state.preference);
	const setPreference = useThemeStore(state => state.setPreference);

	return (
		<IconButton label={`Theme: ${preference}`} onClick={() => setPreference(NEXT[preference])}>
			<span aria-hidden>{ICON[preference]}</span>
		</IconButton>
	);
}
