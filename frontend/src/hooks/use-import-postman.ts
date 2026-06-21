import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { collectionsKey } from "@/hooks/queries/use-collections";
import { environmentsKey } from "@/hooks/queries/use-environments";
import { importPostmanText, type ImportResult } from "@/lib/import/persist";
import { confirmDialog } from "@/lib/ui/modal";

/** Wires an Import button to a hidden file input that ingests Postman exports. */
export function useImportPostman() {
	const inputRef = useRef<HTMLInputElement>(null);
	const qc = useQueryClient();

	const openPicker = () => inputRef.current?.click();

	const onFilesSelected = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const results: ImportResult[] = [];
		const errors: string[] = [];
		for (const file of Array.from(files)) {
			try {
				results.push(await importPostmanText(await file.text()));
			} catch (err) {
				errors.push(`${file.name}: ${err instanceof Error ? err.message : "import failed"}`);
			}
		}

		if (inputRef.current) inputRef.current.value = "";
		await qc.invalidateQueries({ queryKey: collectionsKey });
		await qc.invalidateQueries({ queryKey: environmentsKey });

		const summary = results
			.map(r =>
				r.kind === "collection"
					? `Collection "${r.name}" (${r.requestCount} request${r.requestCount === 1 ? "" : "s"})`
					: `Environment "${r.name}"`,
			)
			.join("\n");
		const message = [summary, errors.length ? `\nFailed:\n${errors.join("\n")}` : ""].join("").trim();

		await confirmDialog({
			title: errors.length ? "Import finished with errors" : "Import complete",
			message: message || "Nothing was imported.",
			danger: errors.length > 0,
			confirmLabel: "OK",
			cancelLabel: "Close",
		});
	};

	return { inputRef, openPicker, onFilesSelected };
}
