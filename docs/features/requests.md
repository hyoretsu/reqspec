# Request Builder

Compose and send an HTTP request.

## What it does

- **Method** — `GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`HEAD`/`OPTIONS` (color-coded).
- **URL** — supports `{{variable}}` interpolation (see [environments](environments.md)).
- **Params** — query parameters; enabled ones are appended to the URL at send time.
- **Headers** — request headers (enable/disable per row).
- **Body**:
  - **None**
  - **Raw** — JSON or plain text; `Content-Type` is set automatically unless you override it.
  - **Form Data** — `multipart/form-data` (text fields in M1).
  - **URL Encoded** — `application/x-www-form-urlencoded`.
- **Auth**:
  - **None**
  - **Basic** — base64-encoded `Authorization: Basic` header.
  - **Bearer** — `Authorization: Bearer <token>`.

## How to use

1. Pick a method, type the URL.
2. Fill Params / Headers / Body / Auth in their tabs. A badge marks tabs with content.
3. Click **Send**. The response appears in the response viewer and is recorded in
   [history](history.md).

Every text input is debounced and disabled rows are dropped before sending.

## Current limits

- No pre-request or test scripts yet.
- Form-data is text-only (no file fields yet).
- No cookie jar / saved auth helpers beyond basic & bearer.

## Where it lives

- UI: `frontend/src/components/request/RequestBuilder/`
- Logic: `frontend/src/lib/request/model.ts`, `frontend/src/lib/http/serialize.ts`
