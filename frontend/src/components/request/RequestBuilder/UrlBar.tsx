import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { barRoundTrips, composeUrl, mergeQueryParams, splitUrl } from "@/lib/request/url";
import { useActiveRequestStore } from "@/lib/store/active-request.store";

const BROKEN_MESSAGE =
	"A query value contains a literal “&”, which the readable URL bar can’t represent. Edit it in Query Params — the URL bar won’t overwrite it until it’s safe.";

/**
 * URL input synced with the Query Params table: the `?query` portion is a live view of the
 * enabled params, and editing it here splits the base off and feeds the params back. Path
 * `:tokens` in the base stay intact and resolve at send time.
 *
 * Values are kept readable (not percent-encoded), so a value holding a literal `&` can't be
 * shown unambiguously. While the params are in that state the bar is flagged and locked: it
 * never commits the typed value to the store, so the last safe value is what gets snapshotted
 * on tab switch, editor close, or app exit (see {@link barRoundTrips}).
 */
export function UrlBar({ className }: { className?: string }) {
	const url = useActiveRequestStore(state => state.draft.url);
	const params = useActiveRequestStore(state => state.draft.params);
	const patchDraft = useActiveRequestStore(state => state.patchDraft);

	const safeValue = composeUrl(url, params);
	const locked = !barRoundTrips(url, params);

	const [local, setLocal] = useState(safeValue);
	const [dirty, setDirty] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Pull external changes (loading a request, table edits) in when not mid-edit.
	useEffect(() => {
		if (!dirty) setLocal(safeValue);
	}, [safeValue, dirty]);
	useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

	const commit = (text: string) => {
		// While a value is unrepresentable, editing the bar would clobber it — don't save.
		if (locked) return;
		const { base, params: parsed } = splitUrl(text);
		patchDraft({ url: base, params: mergeQueryParams(parsed, params) });
		setDirty(false);
	};

	const onChange = (text: string) => {
		setLocal(text);
		setDirty(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => commit(text), 300);
	};

	const onBlur = () => {
		if (timer.current) clearTimeout(timer.current);
		// Flush a pending safe edit; a broken one is simply never committed (commit no-ops).
		commit(local);
	};

	return (
		<div className={clsx("flex flex-col gap-1", className)}>
			<input
				value={local}
				onChange={event => onChange(event.target.value)}
				onBlur={onBlur}
				placeholder="https://api.example.com/v1/users/:id?page={{page}}"
				aria-invalid={locked}
				className={clsx(
					"h-10 w-full rounded-md border bg-surface-raised px-3 text-sm text-fg outline-none transition-colors placeholder:text-muted",
					locked ? "border-danger focus:border-danger" : "border-border focus:border-primary",
				)}
			/>
			{locked ? <span className="text-xs text-danger">{BROKEN_MESSAGE}</span> : null}
		</div>
	);
}
