import type { KeyValue } from "@/lib/request/model";

export interface KeyValueEditorProps {
	items: KeyValue[];
	onChange: (items: KeyValue[]) => void;
	keyPlaceholder?: string;
	valuePlaceholder?: string;
	/** Show a per-row secret toggle and mask secret values (for variables). */
	allowSecret?: boolean;
}

export interface KeyValueRowProps {
	item: KeyValue;
	keyPlaceholder: string;
	valuePlaceholder: string;
	allowSecret?: boolean;
	onChange: (item: KeyValue) => void;
	onRemove: () => void;
}
