import { useEnvironments, useGlobals } from "@/hooks/queries/use-environments";
import { useSessionStore } from "@/lib/store/session.store";
import { buildScope } from "@/lib/vars/scope";
import type { VarScope } from "@/lib/vars/interpolate";

/** Resolve the active variable scope from the selected environment + globals. */
export function useActiveScope(): VarScope {
	const selectedId = useSessionStore(state => state.selectedEnvironmentId);
	const { data: environments } = useEnvironments();
	const { data: globals } = useGlobals();

	const env = environments?.find(e => e.id === selectedId);
	return buildScope(env?.variables, globals?.variables);
}
