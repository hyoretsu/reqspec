import { Button } from "@/components/ui/Button";
import { KeyValueRow } from "@/components/ui/KeyValueEditor/KeyValueRow";
import { createKeyValue, type KeyValue } from "@/lib/request/model";
import type { KeyValueEditorProps } from "./types";

export function KeyValueEditor({
	items,
	onChange,
	keyPlaceholder = "Key",
	valuePlaceholder = "Value",
	allowSecret,
}: KeyValueEditorProps) {
	const update = (id: string, next: KeyValue) =>
		onChange(items.map(item => (item.id === id ? next : item)));

	const remove = (id: string) => onChange(items.filter(item => item.id !== id));

	const add = () => onChange([...items, createKeyValue()]);

	return (
		<div className="flex flex-col gap-2">
			{items.map(item => (
				<KeyValueRow
					key={item.id}
					item={item}
					keyPlaceholder={keyPlaceholder}
					valuePlaceholder={valuePlaceholder}
					allowSecret={allowSecret}
					onChange={next => update(item.id, next)}
					onRemove={() => remove(item.id)}
				/>
			))}
			<div>
				<Button variant="secondary" size="sm" onClick={add}>
					+ Add
				</Button>
			</div>
		</div>
	);
}
