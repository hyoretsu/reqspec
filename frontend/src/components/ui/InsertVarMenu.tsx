import { CustomSelect } from "@/components/ui/CustomSelect";
import type { SelectOption } from "@/components/ui/CustomSelect/types";
import { DYNAMIC_VARIABLE_NAMES } from "@/lib/vars/dynamic";

interface InsertVarMenuProps {
	onInsert: (token: string) => void;
	className?: string;
}

const OPTIONS: SelectOption<string>[] = [
	{ label: "{{ }} variable", value: "" },
	...DYNAMIC_VARIABLE_NAMES.map(name => ({ label: `{{$${name}}}`, value: name })),
];

const PLACEHOLDER: string = "__placeholder__";

/** Action menu that inserts a `{{var}}` placeholder or a `{{$dynamic}}` token. */
export function InsertVarMenu({ onInsert, className }: InsertVarMenuProps) {
	return (
		<CustomSelect
			aria-label="Insert variable"
			value={PLACEHOLDER}
			placeholder="{{ }}"
			options={OPTIONS}
			onChange={name => onInsert(name === "" ? "{{}}" : `{{$${name}}}`)}
			className={className ?? "h-9 w-20"}
		/>
	);
}
