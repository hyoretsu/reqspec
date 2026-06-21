import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as cookiesRepo from "@/lib/db/cookies.repo";

export const cookiesKey = ["cookies"] as const;

export function useCookies() {
	return useQuery({ queryKey: cookiesKey, queryFn: cookiesRepo.listCookies });
}

export function useCookieMutations() {
	const qc = useQueryClient();
	const invalidate = () => qc.invalidateQueries({ queryKey: cookiesKey });

	const remove = useMutation({ mutationFn: cookiesRepo.deleteCookie, onSuccess: invalidate });
	const clear = useMutation({ mutationFn: cookiesRepo.clearCookies, onSuccess: invalidate });

	return { remove, clear };
}
