import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import * as collectionsRepo from "@/lib/db/collections.repo";
import * as environmentsRepo from "@/lib/db/environments.repo";
import * as foldersRepo from "@/lib/db/folders.repo";
import * as requestsRepo from "@/lib/db/requests.repo";
import { httpClient } from "@/lib/http/client";
import type { RequestModel } from "@/lib/request/model";
import { flattenRunItems, type RunConfig, runCollection } from "@/lib/runner";
import { useRunnerStore } from "@/lib/store/runner.store";
import { useSessionStore } from "@/lib/store/session.store";
import type { VarScope } from "@/lib/vars/interpolate";
import { applyVarWrites, hasVarChanges } from "@/lib/vars/persist";
import { buildScope } from "@/lib/vars/scope";

/** Persist a script's env/global/collection writes after a request in the run. */
async function persistScriptVars(
	vars: VarScope,
	selectedEnvironmentId: string | null,
	collectionId: string,
): Promise<boolean> {
	let changed = false;

	const globals = await environmentsRepo.getGlobals();
	if (hasVarChanges(globals.variables, vars.globals)) {
		await environmentsRepo.setGlobals(
			applyVarWrites(globals.variables, vars.globals),
		);
		changed = true;
	}

	if (selectedEnvironmentId) {
		const env = await environmentsRepo.getEnvironment(selectedEnvironmentId);
		if (env && hasVarChanges(env.variables, vars.environment)) {
			await environmentsRepo.setEnvironmentVariables(
				env.id,
				applyVarWrites(env.variables, vars.environment),
			);
			changed = true;
		}
	}

	const collection = await collectionsRepo.getCollection(collectionId);
	if (
		collection &&
		hasVarChanges(collection.variables ?? [], vars.collection)
	) {
		await collectionsRepo.setCollectionVariables(
			collection.id,
			applyVarWrites(collection.variables ?? [], vars.collection),
		);
		changed = true;
	}

	return changed;
}

/** Run the currently-targeted collection/folder via the M6 send pipeline, streaming results into the store. */
export function useCollectionRunner() {
	const qc = useQueryClient();

	return useCallback(
		async (config: RunConfig) => {
			const { target, signal, begin, pushResult, finish } =
				useRunnerStore.getState();
			if (!target) return;
			const { selectedEnvironmentId, activeWorkspaceId } =
				useSessionStore.getState();

			const [folders, requests, collection, environments, globals] =
				await Promise.all([
					foldersRepo.listFoldersByCollection(target.collectionId),
					requestsRepo.listRequestsByCollection(target.collectionId),
					collectionsRepo.getCollection(target.collectionId),
					environmentsRepo.listEnvironments(activeWorkspaceId),
					environmentsRepo.getGlobals(),
				]);
			const items = flattenRunItems(folders, requests, {
				folderId: target.folderId,
			});
			const env = environments.find((e) => e.id === selectedEnvironmentId);
			const baseScope = buildScope({
				environment: env?.variables,
				collection: collection?.variables,
				globals: globals.variables,
			});

			begin();
			let persisted = false;
			// Persist script var writes live so later requests in the run observe them in the DB too.
			const send = async (request: RequestModel, scope: VarScope) => {
				const response = await httpClient.send(request, scope);
				if (
					response.scriptVars &&
					(await persistScriptVars(
						response.scriptVars,
						selectedEnvironmentId,
						target.collectionId,
					))
				) {
					persisted = true;
				}
				return response;
			};

			const report = await runCollection(items, config, {
				send,
				baseScope,
				signal,
				onResult: pushResult,
			});
			finish(report);

			if (persisted) {
				qc.invalidateQueries({ queryKey: ["environments"] });
				qc.invalidateQueries({ queryKey: ["globals"] });
				qc.invalidateQueries({ queryKey: ["collection-vars"] });
			}
		},
		[qc],
	);
}
