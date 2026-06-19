import { IconButton } from "@/components/ui";
import { EnvSelector } from "@/components/environments/EnvironmentManager/EnvSelector";
import { VariablesEditor } from "@/components/environments/EnvironmentManager/VariablesEditor";
import {
	useEnvironments,
	useEnvironmentMutations,
	useGlobals,
} from "@/hooks/queries/use-environments";
import { useSessionStore } from "@/lib/store/session.store";
import { confirmDialog } from "@/lib/ui/modal";

export function EnvironmentManager() {
	const { data: environments } = useEnvironments();
	const { data: globals } = useGlobals();
	const { setVariables, setGlobals, remove } = useEnvironmentMutations();
	const selectedId = useSessionStore(state => state.selectedEnvironmentId);
	const setSelected = useSessionStore(state => state.setSelectedEnvironment);

	const selected = environments?.find(env => env.id === selectedId);

	const deleteEnv = async () => {
		if (!selected) return;
		const ok = await confirmDialog({
			title: "Delete environment?",
			message: `"${selected.name}" will be removed.`,
			danger: true,
			confirmLabel: "Delete",
		});
		if (ok) {
			await remove.mutateAsync(selected.id);
			setSelected(null);
		}
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<h2 className="text-sm font-semibold text-fg">Environments</h2>
			</div>

			<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-3">
				<EnvSelector />

				{selected ? (
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-fg">{selected.name}</span>
							<IconButton label="Delete environment" onClick={deleteEnv}>
								🗑
							</IconButton>
						</div>
						<VariablesEditor
							title="Environment variables"
							variables={selected.variables}
							onChange={variables => setVariables.mutate({ id: selected.id, variables })}
						/>
					</div>
				) : (
					<p className="text-xs text-muted">Select or create an environment to edit its variables.</p>
				)}

				<VariablesEditor
					title="Global variables"
					variables={globals?.variables ?? []}
					onChange={variables => setGlobals.mutate(variables)}
				/>
			</div>
		</div>
	);
}
