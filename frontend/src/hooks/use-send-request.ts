import { useCallback } from "react";
import { useActiveScope } from "@/hooks/use-active-scope";
import { useHistoryMutations } from "@/hooks/queries/use-history";
import * as cookiesRepo from "@/lib/db/cookies.repo";
import { serializeCookieHeader, urlHostPath } from "@/lib/cookies/cookie";
import { httpClient } from "@/lib/http/client";
import { createKeyValue, type RequestModel } from "@/lib/request/model";
import { useActiveRequestStore } from "@/lib/store/active-request.store";
import { interpolate, type VarScope } from "@/lib/vars/interpolate";

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

/** Send the active request, store the response, capture cookies, and record history. */
export function useSendRequest() {
	const scope = useActiveScope();
	const history = useHistoryMutations();

	return useCallback(async () => {
		const { draft, name, setResponse, setSending } = useActiveRequestStore.getState();
		if (draft.url.trim() === "") return;

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
			await history.add.mutateAsync({ name, request: draft, response });
		} finally {
			setSending(false);
		}
	}, [scope, history.add]);
}
