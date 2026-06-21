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

export interface ScopeLayers {
	/** Script-set, request-lifetime variables (highest precedence). */
	local?: Variable[];
	/** Collection-runner data variables. */
	data?: Variable[];
	environment?: Variable[];
	collection?: Variable[];
	globals?: Variable[];
}

/**
 * Build a resolution scope from the variable layers. Enabled vars only.
 * Precedence (high → low): local > data > environment > collection > global.
 */
export function buildScope(layers: ScopeLayers): VarScope {
	return {
		local: toRecord(layers.local),
		data: toRecord(layers.data),
		environment: toRecord(layers.environment),
		collection: toRecord(layers.collection),
		globals: toRecord(layers.globals),
	};
}
