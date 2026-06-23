import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { RunnerPanel } from "@/components/runner";
import { ModalHost } from "@/components/ui";
import { applyTheme, useThemeStore } from "@/lib/store/theme.store";
import appCss from "../globals.css?url";

const queryClient = new QueryClient();

// Runs before hydration: applies the persisted theme class so server/client match
// and there is no flash of the wrong theme. SSR can't read localStorage, so the
// <html> below uses suppressHydrationWarning for this intentional attribute diff.
const themeInitScript = `(function(){try{var s=JSON.parse(localStorage.getItem("reqspec-theme")||"{}");var p=s&&s.state&&s.state.preference||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})()`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			{ title: "ReqSpec" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
		],
	}),
	shellComponent: RootDocument,
	component: Root,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static pre-hydration theme init, no user input */}
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
	const preference = useThemeStore((state) => state.preference);

	useEffect(() => {
		applyTheme(preference);
	}, [preference]);

	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<ModalHost />
			<RunnerPanel />
		</QueryClientProvider>
	);
}
