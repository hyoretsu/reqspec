import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsKey } from "@/hooks/queries/use-collections";
import * as requestsRepo from "@/lib/db/requests.repo";
import type { RequestRow } from "@/lib/db/types";
import type { RequestModel } from "@/lib/request/model";

export function useRequestMutations(collectionId: string) {
	const qc = useQueryClient();
	const invalidate = () => qc.invalidateQueries({ queryKey: requestsKey(collectionId) });

	const create = useMutation({
		mutationFn: ({ name, folderId }: { name: string; folderId?: string | null }) =>
			requestsRepo.createRequest(collectionId, name, folderId ?? null),
		onSuccess: invalidate,
	});

	const update = useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<RequestRow, "name" | "request">> }) =>
			requestsRepo.updateRequest(id, patch),
		onSuccess: invalidate,
	});

	const duplicate = useMutation({ mutationFn: requestsRepo.duplicateRequest, onSuccess: invalidate });
	const reorder = useMutation({ mutationFn: requestsRepo.reorderRequests, onSuccess: invalidate });
	const remove = useMutation({ mutationFn: requestsRepo.deleteRequest, onSuccess: invalidate });

	return { create, update, duplicate, reorder, remove };
}

export async function saveDraft(
	id: string,
	patch: { name?: string; request?: RequestModel },
): Promise<void> {
	await requestsRepo.updateRequest(id, patch);
}
