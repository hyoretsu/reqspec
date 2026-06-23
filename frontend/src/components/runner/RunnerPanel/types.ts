import type { DataRow } from "@/lib/runner";

export interface DataFileState {
	filename: string;
	rows: DataRow[];
	error?: string;
}
