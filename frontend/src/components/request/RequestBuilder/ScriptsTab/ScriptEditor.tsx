import { CustomSelect, type SelectOption, Textarea } from "@/components/ui";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import type { Snippet } from "@/components/request/RequestBuilder/ScriptsTab/snippets";

interface ScriptEditorProps {
	value: string;
	onChange: (value: string) => void;
	snippets: Snippet[];
	placeholder: string;
}

/** A monospace script editor with a "snippets" picker that appends boilerplate. */
export function ScriptEditor({ value, onChange, snippets, placeholder }: ScriptEditorProps) {
	const input = useDebouncedInput({ value, onChange });

	const options: SelectOption<string>[] = snippets.map((s, i) => ({ label: s.label, value: String(i) }));

	const appendSnippet = (index: string) => {
		const code = snippets[Number(index)].code;
		const next = input.value.trim() === "" ? code : `${input.value.replace(/\n*$/, "")}\n\n${code}`;
		input.onChange(next);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<span className="text-xs text-muted">JavaScript — runs in a sandboxed QuickJS engine.</span>
				<div className="w-48">
					<CustomSelect
						aria-label="Insert snippet"
						value=""
						options={options}
						placeholder="Snippets…"
						onChange={appendSnippet}
					/>
				</div>
			</div>
			<Textarea
				value={input.value}
				onChange={input.onChange}
				placeholder={placeholder}
				rows={12}
				className="font-mono text-xs"
			/>
		</div>
	);
}
