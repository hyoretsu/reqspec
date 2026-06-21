# Workspaces, Tabs & Organization

Milestone 2 features for organizing and navigating your work.

## Workspaces (local)

- A **workspace** scopes its own collections and environments. Switch via the selector in the
  top bar; create/delete workspaces there.
- Everything stays local; this is not cloud/team collaboration (that remains out of scope; only
  cross-device sync is the planned paid IAP).
- A default workspace ("My Workspace") always exists and cannot be deleted.

## Request tabs

- Open multiple requests at once; each tab keeps its own editor state and last response.
- Open tabs are **persisted per workspace** and restored on reload.
- `Cmd/Ctrl+T` opens a new scratch tab. Re-opening a request focuses its existing tab.

## Tree organization

- **Folders** (nestable in storage) — create/rename/delete under a collection.
- **Drag-reorder** collections and top-level requests (grab the ⠿ handle).
- **Duplicate** and **rename** requests inline.

## Documentation

- Each request has a **Docs** tab: write Markdown, preview it (sanitized via DOMPurify).

## Examples

- **Save as example** on a response stores a request+response snapshot under the request.
- Examples appear beneath the request in the tree; click one to open it as a tab.

## Search & shortcuts

- **Command palette** — `Cmd/Ctrl+K` searches requests by name/URL across the workspace.
- Shortcuts: `Cmd/Ctrl+Enter` send · `Cmd/Ctrl+S` save · `Cmd/Ctrl+T` new tab.

## Where it lives

- Stores: `frontend/src/lib/store/{tabs,session}.store.ts`
- Data: `frontend/src/lib/db/{workspaces,tabs}.repo.ts`, DB v2 in `db.ts`
- UI: `components/layout/AppShell/WorkspaceSwitcher.tsx`, `components/request/TabStrip.tsx`,
  `components/layout/CommandPalette.tsx`, `components/ui/Sortable.tsx`
