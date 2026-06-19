import type { VarScope } from "@/lib/vars/interpolate";

export interface Variable {
	key: string;
	value: string;
	enabled: boolean;
}

function toRecord(vars: Variable[] | undefined): Record<string, string> {
	const record: Record<string, string> = {};
	for (const v of vars ?? []) {
		if (v.enabled && v.key !== "") record[v.key] = v.value;
	}
	return record;
}

/** Build a resolution scope from environment + global variables. Enabled only; env wins. */
export function buildScope(envVars: Variable[] | undefined, globalVars: Variable[] | undefined): VarScope {
	return {
		env: toRecord(envVars),
		globals: toRecord(globalVars),
	};
}
