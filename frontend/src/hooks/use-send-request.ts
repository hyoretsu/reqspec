import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useActiveScope } from "@/hooks/use-active-scope";
import { useHistoryMutations } from "@/hooks/queries/use-history";
import * as collectionsRepo from "@/lib/db/collections.repo";
import * as cookiesRepo from "@/lib/db/cookies.repo";
import * as environmentsRepo from "@/lib/db/environments.repo";
import * as requestsRepo from "@/lib/db/requests.repo";
import { serializeCookieHeader, urlHostPath } from "@/lib/cookies/cookie";
import { httpClient } from "@/lib/http/client";
import { createKeyValue, type RequestModel } from "@/lib/request/model";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import { useSessionStore } from "@/lib/store/session.store";
import { interpolate, type VarScope } from "@/lib/vars/interpolate";
import { applyVarWrites, hasVarChanges } from "@/lib/vars/persist";

/** Attach matching jar cookies as a Cookie header on the interpolated request URL. */
async function withCookies(draft: RequestModel, scope: VarScope): Promise<RequestModel> {
	const target = urlHostPath(interpolate(draft.url, scope));
	if (!target) return draft;
	const cookies = await cookiesRepo.matchingCookies(target.host, target.path);
	if (cookies.length === 0) return draft;
	const hasCookieHeader = draft.headers.some(h => h.enabled && h.key.toLowerCase() === "cookie");
	if (hasCookieHeader) return draft;
	return {
		...draft,
		headers: [...draft.headers, createKeyValue({ key: "Cookie", value: serializeCookieHeader(cookies) })],
	};
}

/** Persist variable writes a script made back into environment/globals/collection stores. */
async function persistScriptVars(
	vars: VarScope,
	selectedEnvironmentId: string | null,
	requestId: string | null,
): Promise<boolean> {
	let changed = false;

	const globals = await environmentsRepo.getGlobals();
	if (hasVarChanges(globals.variables, vars.globals)) {
		await environmentsRepo.setGlobals(applyVarWrites(globals.variables, vars.globals));
		changed = true;
	}

	if (selectedEnvironmentId) {
		const env = await environmentsRepo.getEnvironment(selectedEnvironmentId);
		if (env && hasVarChanges(env.variables, vars.environment)) {
			await environmentsRepo.setEnvironmentVariables(env.id, applyVarWrites(env.variables, vars.environment));
			changed = true;
		}
	}

	if (requestId) {
		const request = await requestsRepo.getRequest(requestId);
		const collection = request ? await collectionsRepo.getCollection(request.collectionId) : undefined;
		if (collection && hasVarChanges(collection.variables ?? [], vars.collection)) {
			await collectionsRepo.setCollectionVariables(collection.id, applyVarWrites(collection.variables ?? [], vars.collection));
			changed = true;
		}
	}

	return changed;
}

/** Send the active request, store the response, capture cookies, and record history. */
export function useSendRequest() {
	const scope = useActiveScope();
	const history = useHistoryMutations();
	const qc = useQueryClient();

	return useCallback(async () => {
		const { draft, name, setResponse, setSending } = useActiveRequestStore.getState();
		if (draft.url.trim() === "") return;
		const { selectedEnvironmentId } = useSessionStore.getState();
		const { requestId } = useActiveRequestStore.getState();

		setSending(true);
		setResponse(null);
		try {
			const toSend = await withCookies(draft, scope);
			const response = await httpClient.send(toSend, scope);
			setResponse(response);

			const target = urlHostPath(interpolate(draft.url, scope));
			if (target && response.cookies.length > 0) {
				await cookiesRepo.storeFromResponse(target.host, response.cookies);
			}

			if (draft.events.length > 0 && response.scriptVars) {
				const changed = await persistScriptVars(response.scriptVars, selectedEnvironmentId, requestId);
				if (changed) {
					qc.invalidateQueries({ queryKey: ["environments"] });
					qc.invalidateQueries({ queryKey: ["globals"] });
					qc.invalidateQueries({ queryKey: ["collection-vars"] });
				}
			}

			await history.add.mutateAsync({ name, request: draft, response });
		} finally {
			setSending(false);
		}
	}, [scope, history.add, qc]);
}
