import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as environmentsRepo from "@/lib/db/environments.repo";
import type { VariableRow } from "@/lib/db/types";

export const environmentsKey = ["environments"] as const;
export const globalsKey = ["globals"] as const;

export function useEnvironments(workspaceId: string) {
	return useQuery({
		queryKey: [...environmentsKey, workspaceId],
		queryFn: () => environmentsRepo.listEnvironments(workspaceId),
	});
}

export function useGlobals() {
	return useQuery({ queryKey: globalsKey, queryFn: environmentsRepo.getGlobals });
}

export function useEnvironmentMutations() {
	const qc = useQueryClient();
	const invalidateEnvs = () => qc.invalidateQueries({ queryKey: environmentsKey });
	const invalidateGlobals = () => qc.invalidateQueries({ queryKey: globalsKey });

	const create = useMutation({
		mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
			environmentsRepo.createEnvironment(workspaceId, name),
		onSuccess: invalidateEnvs,
	});
	const rename = useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			environmentsRepo.renameEnvironment(id, name),
		onSuccess: invalidateEnvs,
	});
	const setVariables = useMutation({
		mutationFn: ({ id, variables }: { id: string; variables: VariableRow[] }) =>
			environmentsRepo.setEnvironmentVariables(id, variables),
		onSuccess: invalidateEnvs,
	});
	const remove = useMutation({ mutationFn: environmentsRepo.deleteEnvironment, onSuccess: invalidateEnvs });
	const setGlobals = useMutation({
		mutationFn: (variables: VariableRow[]) => environmentsRepo.setGlobals(variables),
		onSuccess: invalidateGlobals,
	});

	return { create, rename, setVariables, remove, setGlobals };
}
