import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { NodeEditor } from "@/components/ui/JsonBuilder/NodeEditor";
import { createNode, type JsonNode, parseToNode, serializeNode } from "@/lib/json/builder";

interface JsonBuilderProps {
	/** Current JSON text (source of truth). Parsed once on mount. */
	value: string;
	onChange: (text: string) => void;
}

/** Visual JSON editor (typed key/value tree). Re-mount it to re-parse external text. */
export function JsonBuilder({ value, onChange }: JsonBuilderProps) {
	const initial = useMemo(() => parseToNode(value), [value]);
	const [node, setNode] = useState<JsonNode | null>(initial);

	if (node === null) {
		return (
			<div className="flex flex-col items-start gap-2 rounded-md border border-border bg-surface p-3 text-sm">
				<p className="text-muted">This body isn't valid JSON, so it can't be edited as a tree.</p>
				<Button
					variant="secondary"
					size="sm"
					onClick={() => {
						const empty = createNode("object");
						setNode(empty);
						onChange(serializeNode(empty));
					}}
				>
					Start fresh as an object
				</Button>
			</div>
		);
	}

	const update = (next: JsonNode) => {
		setNode(next);
		onChange(serializeNode(next));
	};

	return <NodeEditor node={node} onChange={update} />;
}
