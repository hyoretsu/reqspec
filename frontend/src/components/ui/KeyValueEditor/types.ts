import type { KeyValue } from "@/lib/request/model";

export interface KeyValueEditorProps {
	items: KeyValue[];
	onChange: (items: KeyValue[]) => void;
	keyPlaceholder?: string;
	valuePlaceholder?: string;
}

export interface KeyValueRowProps {
	item: KeyValue;
	keyPlaceholder: string;
	valuePlaceholder: string;
	onChange: (item: KeyValue) => void;
	onRemove: () => void;
}
