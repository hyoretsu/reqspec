import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as collectionsRepo from "@/lib/db/collections.repo";
import * as foldersRepo from "@/lib/db/folders.repo";
import * as requestsRepo from "@/lib/db/requests.repo";

export const collectionsKey = ["collections"] as const;
export const foldersKey = (collectionId: string) => ["folders", collectionId] as const;
export const requestsKey = (collectionId: string) => ["requests", collectionId] as const;

export function useCollections(workspaceId: string) {
	return useQuery({
		queryKey: [...collectionsKey, workspaceId],
		queryFn: () => collectionsRepo.listCollections(workspaceId),
	});
}

export function useFolders(collectionId: string) {
	return useQuery({
		queryKey: foldersKey(collectionId),
		queryFn: () => foldersRepo.listFoldersByCollection(collectionId),
	});
}

export function useRequests(collectionId: string) {
	return useQuery({
		queryKey: requestsKey(collectionId),
		queryFn: () => requestsRepo.listRequestsByCollection(collectionId),
	});
}

export function useCollectionMutations() {
	const qc = useQueryClient();
	const invalidate = () => qc.invalidateQueries({ queryKey: collectionsKey });

	const create = useMutation({
		mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
			collectionsRepo.createCollection(workspaceId, name),
		onSuccess: invalidate,
	});
	const rename = useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) => collectionsRepo.renameCollection(id, name),
		onSuccess: invalidate,
	});
	const reorder = useMutation({ mutationFn: collectionsRepo.reorderCollections, onSuccess: invalidate });
	const setVariables = useMutation({
		mutationFn: ({ id, variables }: { id: string; variables: import("@/lib/db/types").VariableRow[] }) =>
			collectionsRepo.setCollectionVariables(id, variables),
		onSuccess: invalidate,
	});
	const remove = useMutation({ mutationFn: collectionsRepo.deleteCollection, onSuccess: invalidate });

	return { create, rename, reorder, setVariables, remove };
}
