import { createRouter } from "@tanstack/react-router";
import { NotFound } from "@/components/ui/NotFound";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	return createRouter({
		scrollRestoration: true,
		routeTree,
		defaultNotFoundComponent: NotFound,
	});
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
