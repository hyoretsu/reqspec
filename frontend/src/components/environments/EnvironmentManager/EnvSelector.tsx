import { Button, CustomSelect, type SelectOption } from "@/components/ui";
import { useEnvironments, useEnvironmentMutations } from "@/hooks/queries/use-environments";
import { useSessionStore } from "@/lib/store/session.store";
import { promptDialog } from "@/lib/ui/modal";

const NONE = "__none__";

export function EnvSelector() {
	const workspaceId = useSessionStore(state => state.activeWorkspaceId);
	const { data: environments } = useEnvironments(workspaceId);
	const { create } = useEnvironmentMutations();
	const selectedId = useSessionStore(state => state.selectedEnvironmentId);
	const setSelected = useSessionStore(state => state.setSelectedEnvironment);

	const options: SelectOption<string>[] = [
		{ label: "No environment", value: NONE },
		...(environments ?? []).map(env => ({ label: env.name, value: env.id })),
	];

	const addEnvironment = async () => {
		const name = await promptDialog({ title: "New environment", placeholder: "e.g. Production" });
		if (name) {
			const env = await create.mutateAsync({ workspaceId, name });
			setSelected(env.id);
		}
	};

	return (
		<div className="flex items-center gap-2">
			<CustomSelect
				aria-label="Active environment"
				value={selectedId ?? NONE}
				options={options}
				onChange={value => setSelected(value === NONE ? null : value)}
				className="flex-1"
			/>
			<Button size="sm" variant="secondary" onClick={addEnvironment}>
				+ New
			</Button>
		</div>
	);
}
