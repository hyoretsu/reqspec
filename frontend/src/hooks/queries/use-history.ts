import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as historyRepo from "@/lib/db/history.repo";

export const historyKey = ["history"] as const;

export function useHistory(limit?: number) {
	return useQuery({ queryKey: historyKey, queryFn: () => historyRepo.listHistory(limit) });
}

export function useHistoryMutations() {
	const qc = useQueryClient();
	const invalidate = () => qc.invalidateQueries({ queryKey: historyKey });

	const add = useMutation({ mutationFn: historyRepo.addHistory, onSuccess: invalidate });
	const remove = useMutation({ mutationFn: historyRepo.deleteHistory, onSuccess: invalidate });
	const clear = useMutation({ mutationFn: historyRepo.clearHistory, onSuccess: invalidate });

	return { add, remove, clear };
}
