import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { SelectOption } from "@/components/ui/CustomSelect/types";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { IconButton } from "@/components/ui/IconButton";
import { InsertVarMenu } from "@/components/ui/InsertVarMenu";
import { Input } from "@/components/ui/Input";
import { createNode, type JsonNode, type JsonNodeKind } from "@/lib/json/builder";

const KIND_OPTIONS: SelectOption<JsonNodeKind>[] = [
	{ label: "String", value: "string" },
	{ label: "Number", value: "number" },
	{ label: "Boolean", value: "boolean" },
	{ label: "Null", value: "null" },
	{ label: "Date/Time", value: "datetime" },
	{ label: "Object", value: "object" },
	{ label: "Array", value: "array" },
];

const BOOL_OPTIONS: SelectOption<"true" | "false">[] = [
	{ label: "true", value: "true" },
	{ label: "false", value: "false" },
];

interface NodeEditorProps {
	node: JsonNode;
	onChange: (node: JsonNode) => void;
}

export function NodeEditor({ node, onChange }: NodeEditorProps) {
	const kindSelect = (
		<CustomSelect
			aria-label="Value type"
			value={node.kind}
			options={KIND_OPTIONS}
			onChange={kind => onChange(createNode(kind))}
			className="h-9 w-28 shrink-0"
		/>
	);

	if (node.kind === "object") {
		return (
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">{kindSelect}</div>
				<div className="flex flex-col gap-2 border-l border-border pl-3">
					{node.entries.map((entry, index) => (
						<div key={entry.id} className="flex flex-col gap-1">
							<div className="flex items-center gap-2">
								<Input
									value={entry.key}
									onChange={key =>
										onChange({
											...node,
											entries: node.entries.map((e, i) => (i === index ? { ...e, key } : e)),
										})
									}
									placeholder="key"
									className="h-9 w-40"
								/>
								<IconButton
									label="Remove field"
									onClick={() => onChange({ ...node, entries: node.entries.filter((_, i) => i !== index) })}
								>
									✕
								</IconButton>
							</div>
							<div className="pl-4">
								<NodeEditor
									node={entry.node}
									onChange={child =>
										onChange({
											...node,
											entries: node.entries.map((e, i) => (i === index ? { ...e, node: child } : e)),
										})
									}
								/>
							</div>
						</div>
					))}
					<div>
						<Button
							variant="secondary"
							size="sm"
							onClick={() =>
								onChange({
									...node,
									entries: [...node.entries, { id: crypto.randomUUID(), key: "", node: createNode("string") }],
								})
							}
						>
							+ Field
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (node.kind === "array") {
		return (
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">{kindSelect}</div>
				<div className="flex flex-col gap-2 border-l border-border pl-3">
					{node.items.map((item, index) => (
						<div key={item.id} className="flex items-start gap-2">
							<span className="mt-2 text-xs text-muted">{index}</span>
							<div className="flex-1">
								<NodeEditor
									node={item.node}
									onChange={child =>
										onChange({ ...node, items: node.items.map((it, i) => (i === index ? { ...it, node: child } : it)) })
									}
								/>
							</div>
							<IconButton
								label="Remove item"
								onClick={() => onChange({ ...node, items: node.items.filter((_, i) => i !== index) })}
							>
								✕
							</IconButton>
						</div>
					))}
					<div>
						<Button
							variant="secondary"
							size="sm"
							onClick={() =>
								onChange({ ...node, items: [...node.items, { id: crypto.randomUUID(), node: createNode("string") }] })
							}
						>
							+ Item
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			{kindSelect}
			{node.kind === "string" ? (
				<>
					<Input
						value={node.value}
						onChange={value => onChange({ kind: "string", value })}
						placeholder="value"
						className="h-9 flex-1"
					/>
					<InsertVarMenu onInsert={token => onChange({ kind: "string", value: node.value + token })} />
				</>
			) : null}
			{node.kind === "number" ? (
				<Input
					value={node.value}
					onChange={value => onChange({ kind: "number", value })}
					inputMode="decimal"
					placeholder="0"
					className="h-9 flex-1"
				/>
			) : null}
			{node.kind === "boolean" ? (
				<CustomSelect
					aria-label="Boolean value"
					value={node.value ? "true" : "false"}
					options={BOOL_OPTIONS}
					onChange={v => onChange({ kind: "boolean", value: v === "true" })}
					className="h-9 w-28"
				/>
			) : null}
			{node.kind === "null" ? <span className="text-sm text-muted">null</span> : null}
			{node.kind === "datetime" ? (
				<DateTimeField
					epochMs={node.epochMs}
					format={node.format}
					onChange={({ epochMs, format }) => onChange({ kind: "datetime", epochMs, format })}
				/>
			) : null}
		</div>
	);
}
