import { useMutation, useQueryClient } from "@tanstack/react-query";
import { foldersKey, requestsKey } from "@/hooks/queries/use-collections";
import * as foldersRepo from "@/lib/db/folders.repo";

export function useFolderMutations(collectionId: string) {
	const qc = useQueryClient();
	const invalidate = () => {
		qc.invalidateQueries({ queryKey: foldersKey(collectionId) });
		qc.invalidateQueries({ queryKey: requestsKey(collectionId) });
	};

	const create = useMutation({
		mutationFn: ({ name, parentFolderId }: { name: string; parentFolderId?: string | null }) =>
			foldersRepo.createFolder(collectionId, name, parentFolderId ?? null),
		onSuccess: invalidate,
	});
	const rename = useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) => foldersRepo.renameFolder(id, name),
		onSuccess: invalidate,
	});
	const remove = useMutation({ mutationFn: foldersRepo.deleteFolder, onSuccess: invalidate });

	return { create, rename, remove };
}
