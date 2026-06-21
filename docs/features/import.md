# Import (Postman)

Bring existing Postman work into ReqSpec.

## What it does

Imports **Postman Collection v2.1** and **Postman Environment** exports (`.json`):

- **Collection** → a ReqSpec collection. Nested Postman folders become nested folders;
  every request is imported with its method, URL (query split into params), headers
  (enabled/disabled preserved), body, and auth.
  - Body modes: `raw` (JSON/text), `urlencoded`, `formdata` (file fields keep the key).
  - Auth: `basic`, `bearer` (others import as **No Auth**).
  - Collection-level variables become a new environment named after the collection.
- **Environment** → a ReqSpec environment with all its variables (enabled flags preserved).

Detection is automatic from the file shape; you can select **multiple files** at once
(mix of collections and environments), and a summary reports what was imported.

## How to use

1. In the **Collections** panel, click **Import**.
2. Pick one or more Postman `.json` exports.
3. ReqSpec parses, persists, and shows a summary. New collections/environments appear
   immediately.

Works the same on web, desktop, and mobile (uses a standard file picker; no extra
permissions).

## Current limits

- Postman **variables/scripts inside requests** (pre-request/test scripts) are not executed
  or imported.
- Auth types beyond basic/bearer are dropped to No Auth.
- `file` form-data fields import the key only (no file contents).
- No export back to Postman format yet; no OpenAPI/cURL/HAR/Insomnia import yet.

## Where it lives

- Parser (pure): `frontend/src/lib/import/postman.ts`
- Persist glue: `frontend/src/lib/import/persist.ts`
- UI: `frontend/src/hooks/use-import-postman.ts`, Collections panel header
