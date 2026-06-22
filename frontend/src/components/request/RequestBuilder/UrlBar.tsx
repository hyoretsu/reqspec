import { Input } from "@/components/ui";
import { composeUrl, mergeQueryParams, splitUrl } from "@/lib/request/url";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

/**
 * URL input synced with the Query Params table: the `?query` portion is a live view of the
 * enabled params, and editing it here splits the base off and feeds the params back. Path
 * `:tokens` in the base are left intact and resolved at send time.
 */
export function UrlBar({ className }: { className?: string }) {
	const url = useActiveRequestStore(state => state.draft.url);
	const params = useActiveRequestStore(state => state.draft.params);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	const onChange = (text: string) => {
		const { base, params: parsed } = splitUrl(text);
		patchDraft({ url: base, params: mergeQueryParams(parsed, params) });
	};

	return (
		<Input
			value={composeUrl(url, params)}
			onChange={onChange}
			placeholder="https://api.example.com/v1/users/:id?page={{page}}"
			className={className}
		/>
	);
}
