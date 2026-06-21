import { useQuery } from "@tanstack/react-query";
import { useEnvironments, useGlobals } from "@/hooks/queries/use-environments";
import * as collectionsRepo from "@/lib/db/collections.repo";
import * as requestsRepo from "@/lib/db/requests.repo";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import { useSessionStore } from "@/lib/store/session.store";
import { buildScope } from "@/lib/vars/scope";
import type { VarScope } from "@/lib/vars/interpolate";

/** Resolve the active variable scope: environment + collection + globals (+ dynamic at use). */
export function useActiveScope(): VarScope {
	const selectedId = useSessionStore(state => state.selectedEnvironmentId);
	const workspaceId = useSessionStore(state => state.activeWorkspaceId);
	const requestId = useActiveRequestStore(state => state.requestId);
	const { data: environments } = useEnvironments(workspaceId);
	const { data: globals } = useGlobals();

	// The active request's owning collection contributes collection-scoped variables.
	const { data: collectionVars } = useQuery({
		queryKey: ["collection-vars", requestId],
		enabled: requestId !== null,
		queryFn: async () => {
			const request = requestId ? await requestsRepo.getRequest(requestId) : null;
			if (!request) return [];
			const collection = await collectionsRepo.getCollection(request.collectionId);
			return collection?.variables ?? [];
		},
	});

	const env = environments?.find(e => e.id === selectedId);
	return buildScope({
		environment: env?.variables,
		collection: collectionVars ?? undefined,
		globals: globals?.variables,
	});
}
