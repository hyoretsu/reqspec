import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ModalHost } from "@/components/ui";
import { applyTheme, useThemeStore } from "@/lib/store/theme.store";
import "../globals.css";

const queryClient = new QueryClient();

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	const preference = useThemeStore(state => state.preference);

	useEffect(() => {
		applyTheme(preference);
	}, [preference]);

	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<ModalHost />
		</QueryClientProvider>
	);
}
