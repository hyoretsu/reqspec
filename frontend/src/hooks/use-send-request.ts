import { useCallback } from "react";
import { useActiveScope } from "@/hooks/use-active-scope";
import { useHistoryMutations } from "@/hooks/queries/use-history";
import { httpClient } from "@/lib/http/client";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

/** Send the active request, store the response, and record it in history. */
export function useSendRequest() {
	const scope = useActiveScope();
	const history = useHistoryMutations();

	return useCallback(async () => {
		const { draft, name, setResponse, setSending } = useActiveRequestStore.getState();
		if (draft.url.trim() === "") return;

		setSending(true);
		setResponse(null);
		try {
			const response = await httpClient.send(draft, scope);
			setResponse(response);
			await history.add.mutateAsync({ name, request: draft, response });
		} finally {
			setSending(false);
		}
	}, [scope, history.add]);
}
