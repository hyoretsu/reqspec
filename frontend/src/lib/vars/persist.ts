import type { VariableRow } from "@/lib/db/types";
import { createKeyValue } from "@/lib/request/model";

/**
 * Fold a script's final variable record back into stored variable rows.
 *
 * Enabled rows whose key still exists in `final` take its (possibly new) value; enabled
 * rows whose key was removed (`pm.*.unset`) are dropped; disabled rows are left untouched.
 * Keys present in `final` with no matching enabled row are appended as new enabled rows.
 * Pure — returns a new array, mutating nothing.
 */
export function applyVarWrites(rows: VariableRow[], final: Record<string, string>): VariableRow[] {
	const seen = new Set<string>();
	const next: VariableRow[] = [];

	for (const row of rows) {
		if (!row.enabled) {
			next.push(row);
			continue;
		}
		if (row.key in final) {
			next.push({ ...row, value: final[row.key] });
			seen.add(row.key);
		}
		// else: enabled row whose key was unset → dropped.
	}

	for (const [key, value] of Object.entries(final)) {
		if (!seen.has(key)) next.push(createKeyValue({ key, value }));
	}

	return next;
}

/** True when `final` differs from the enabled-row projection of `rows` (worth persisting). */
export function hasVarChanges(rows: VariableRow[], final: Record<string, string>): boolean {
	const enabled = rows.filter(r => r.enabled);
	const keys = Object.keys(final);
	if (enabled.length !== keys.length) return true;
	return enabled.some(r => !(r.key in final) || final[r.key] !== r.value);
}
