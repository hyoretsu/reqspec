interface KeyValueListProps {
	items: { key: string; value: string }[];
	emptyLabel?: string;
}

/** Read-only key/value display (response headers, etc.). */
export function KeyValueList({ items, emptyLabel = "Nothing to show" }: KeyValueListProps) {
	if (items.length === 0) {
		return <p className="p-3 text-xs text-muted">{emptyLabel}</p>;
	}

	return (
		<div className="divide-y divide-border font-mono text-xs">
			{items.map((item, index) => (
				<div key={`${item.key}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 py-1.5">
					<span className="truncate font-semibold text-muted">{item.key}</span>
					<span className="break-words text-fg">{item.value}</span>
				</div>
			))}
		</div>
	);
}
