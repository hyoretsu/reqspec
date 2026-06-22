/**
 * In-memory store for selected files, keyed by a stable field/body id.
 *
 * Browser `File` objects can't be serialized into Dexie, so file selections live only
 * for the current session (they don't persist across reloads). Works identically on web
 * and inside the Tauri webview (both expose the File API via `<input type="file">`).
 */
const store = new Map<string, File>();

export function setFile(id: string, file: File): void {
	store.set(id, file);
}

export function getFile(id: string): File | undefined {
	return store.get(id);
}

export function hasFile(id: string): boolean {
	return store.has(id);
}

export function removeFile(id: string): void {
	store.delete(id);
}
