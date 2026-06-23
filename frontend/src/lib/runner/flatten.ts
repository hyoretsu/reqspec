/**
 * Flatten a collection's folders + requests into an ordered run sequence (pure).
 *
 * Depth-first tree order: at each level the directly-contained requests run first
 * (sorted by `order`), then each child folder is descended into (folders sorted by
 * `order`). A `folderId` scope starts the walk at that folder instead of the root.
 */

import type { FolderRow, RequestRow } from "@/lib/db/types";
import type { RunItem } from "./run";

export interface FlattenOptions {
	/** Restrict to this folder and its descendants; null/undefined runs the whole collection. */
	folderId?: string | null;
}

export function flattenRunItems(
	folders: FolderRow[],
	requests: RequestRow[],
	options: FlattenOptions = {},
): RunItem[] {
	const byOrder = <T extends { order: number }>(a: T, b: T) =>
		a.order - b.order;
	const childFolders = (parentFolderId: string | null) =>
		folders.filter((f) => f.parentFolderId === parentFolderId).sort(byOrder);
	const folderRequests = (folderId: string | null) =>
		requests.filter((r) => r.folderId === folderId).sort(byOrder);

	const items: RunItem[] = [];
	const walk = (folderId: string | null) => {
		for (const req of folderRequests(folderId)) {
			items.push({ id: req.id, name: req.name, request: req.request });
		}
		for (const child of childFolders(folderId)) walk(child.id);
	};

	walk(options.folderId ?? null);
	return items;
}
