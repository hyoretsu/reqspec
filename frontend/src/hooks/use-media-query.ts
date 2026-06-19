import { useEffect, useState } from "react";

/** Reactive media-query match. SSR-safe (returns false until mounted). */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const list = window.matchMedia(query);
		setMatches(list.matches);
		const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
		list.addEventListener("change", handler);
		return () => list.removeEventListener("change", handler);
	}, [query]);

	return matches;
}

/** True on desktop-width viewports (>= 768px). */
export function useIsDesktop(): boolean {
	return useMediaQuery("(min-width: 768px)");
}
