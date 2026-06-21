import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as workspacesRepo from "@/lib/db/workspaces.repo";

export const workspacesKey = ["workspaces"] as const;

export function useWorkspaces() {
	return useQuery({ queryKey: workspacesKey, queryFn: workspacesRepo.listWorkspaces });
}

export function useWorkspaceMutations() {
	const qc = useQueryClient();
	const invalidate = () => qc.invalidateQueries();

	const create = useMutation({ mutationFn: workspacesRepo.createWorkspace, onSuccess: invalidate });
	const rename = useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) => workspacesRepo.renameWorkspace(id, name),
		onSuccess: invalidate,
	});
	const remove = useMutation({ mutationFn: workspacesRepo.deleteWorkspace, onSuccess: invalidate });

	return { create, rename, remove };
}
