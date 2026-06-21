import { CustomSelect, IconButton, type SelectOption } from "@/components/ui";
import { useWorkspaces, useWorkspaceMutations } from "@/hooks/queries/use-workspaces";
import { DEFAULT_WORKSPACE_ID } from "@/lib/db/types";
import { useSessionStore } from "@/lib/store/session.store";
import { confirmDialog, promptDialog } from "@/lib/ui/modal";

export function WorkspaceSwitcher() {
	const { data: workspaces } = useWorkspaces();
	const { create, remove } = useWorkspaceMutations();
	const activeId = useSessionStore(state => state.activeWorkspaceId);
	const setActive = useSessionStore(state => state.setActiveWorkspace);

	const options: SelectOption<string>[] = (workspaces ?? []).map(w => ({ label: w.name, value: w.id }));

	const addWorkspace = async () => {
		const name = await promptDialog({ title: "New workspace", placeholder: "e.g. Personal" });
		if (name) {
			const ws = await create.mutateAsync(name);
			setActive(ws.id);
		}
	};

	const deleteWorkspace = async () => {
		if (activeId === DEFAULT_WORKSPACE_ID) return;
		const current = workspaces?.find(w => w.id === activeId);
		const ok = await confirmDialog({
			title: "Delete workspace?",
			message: `"${current?.name}" and all its collections & environments will be removed.`,
			danger: true,
			confirmLabel: "Delete",
		});
		if (ok) {
			await remove.mutateAsync(activeId);
			setActive(DEFAULT_WORKSPACE_ID);
		}
	};

	return (
		<div className="flex items-center gap-1">
			<CustomSelect
				aria-label="Active workspace"
				value={activeId}
				options={options}
				onChange={setActive}
				className="h-8 w-40"
			/>
			<IconButton label="New workspace" onClick={addWorkspace}>
				+
			</IconButton>
			{activeId !== DEFAULT_WORKSPACE_ID ? (
				<IconButton label="Delete workspace" onClick={deleteWorkspace}>
					🗑
				</IconButton>
			) : null}
		</div>
	);
}
