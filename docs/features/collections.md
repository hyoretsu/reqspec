# Collections & Requests

Organize saved requests into collections.

## What it does

- **Collections** group related requests (e.g. one per API or project).
- **Requests** are saved HTTP request definitions (method, URL, params, headers, body, auth).
- Folders are modeled in storage (nestable via `parentFolderId`) for future nesting; the
  Milestone 1 UI lists requests flat under each collection.

## How to use

- **New collection** — `+ New` in the Collections panel header; name it in the prompt.
- **New request** — hover a collection, click `+`; name it. It is created with the default
  empty `GET` request.
- **Open a request** — click it; its definition loads into the request builder.
- **Rename / delete** — hover a collection for inline actions. Deleting a collection cascades
  to its folders and requests.
- **Save edits** — after opening a saved request and editing it, the builder shows a **Save**
  button (enabled while there are unsaved changes).

## Current limits

- No drag-and-drop reordering or folder UI yet (storage supports it).
- No import/export (Postman/OpenAPI) yet.

## Where it lives

- UI: `frontend/src/components/collections/CollectionsTree/`
- Data: `frontend/src/lib/db/collections.repo.ts`, `requests.repo.ts`, `folders.repo.ts`
