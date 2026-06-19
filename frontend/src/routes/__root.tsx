import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { ModalHost } from "@/components/ui";
import { applyTheme, useThemeStore } from "@/lib/store/theme.store";
import appCss from "../globals.css?url";

const queryClient = new QueryClient();

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
			{ title: "ReqSpec" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
	component: Root,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

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
