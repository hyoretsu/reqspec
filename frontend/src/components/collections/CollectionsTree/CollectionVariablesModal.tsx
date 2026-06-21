import { useState } from "react";
import { Button, KeyValueEditor, Modal } from "@/components/ui";
import { useCollectionMutations } from "@/hooks/queries/use-collections";
import type { CollectionRow, VariableRow } from "@/lib/db/types";

interface CollectionVariablesModalProps {
	collection: CollectionRow;
	onClose: () => void;
}

export function CollectionVariablesModal({ collection, onClose }: CollectionVariablesModalProps) {
	const [variables, setVariables] = useState<VariableRow[]>(collection.variables ?? []);
	const { setVariables: save } = useCollectionMutations();

	const onSave = async () => {
		await save.mutateAsync({ id: collection.id, variables });
		onClose();
	};

	return (
		<Modal
			title={`Variables · ${collection.name}`}
			onClose={onClose}
			footer={
				<>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={onSave}>Save</Button>
				</>
			}
		>
			<p className="mb-2 text-xs text-muted">
				Collection variables apply to every request in this collection (precedence below environment).
			</p>
			<KeyValueEditor
				items={variables}
				onChange={setVariables}
				keyPlaceholder="variable"
				valuePlaceholder="value"
				allowSecret
			/>
		</Modal>
	);
}
