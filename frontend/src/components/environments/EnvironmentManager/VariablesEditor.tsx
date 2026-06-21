import { KeyValueEditor } from "@/components/ui";
import type { VariableRow } from "@/lib/db/types";

interface VariablesEditorProps {
	title: string;
	variables: VariableRow[];
	onChange: (variables: VariableRow[]) => void;
}

export function VariablesEditor({ title, variables, onChange }: VariablesEditorProps) {
	return (
		<section className="flex flex-col gap-2">
			<h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
			<KeyValueEditor
				items={variables}
				onChange={onChange}
				keyPlaceholder="variable"
				valuePlaceholder="value"
				allowSecret
			/>
		</section>
	);
}
