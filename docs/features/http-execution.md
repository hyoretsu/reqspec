# HTTP Execution

How ReqSpec actually sends requests, and why behavior differs between platforms.

## The pipeline

`interpolate → serialize → adapter (I/O) → normalize`

1. **Interpolate** — resolve `{{variables}}` across the request.
2. **Serialize** — build the final URL (with query string), headers (including derived
   `Content-Type` and `Authorization`), and body. Disabled rows are dropped.
3. **Adapter** — perform the network I/O (the only impure step).
4. **Normalize** — capture status, headers, decoded body, byte size, cookies, and timing.

The request layer is [**ky**](https://github.com/sindresorhus/ky). Both adapters share one ky
config; the only difference is the injected `fetch` implementation. ky runs with
`throwHttpErrors: false` so 4xx/5xx come back as data to display — an API client must show
error responses, not throw them.

## Native (Tauri desktop/mobile)

Uses `@tauri-apps/plugin-http`, which proxies the request through the Rust core (IPC). This
**bypasses browser CORS** — you can call any host, exactly like a desktop API client.

Capability scope is open (`http://*`, `https://*`) in
`frontend/src-tauri/capabilities/default.json`.

## Web

Uses the browser's `fetch`. This is subject to **CORS**: cross-origin hosts without permissive
CORS headers will fail. The failure is surfaced as a friendly response error rather than a
crash. The native build is the unrestricted path.

## Current limits

- No request cancellation / streaming UI yet (60s timeout, no retries).
- Binary responses are decoded as UTF-8 text for display; size is computed from raw bytes.

## Where it lives

- `frontend/src/lib/http/` — `client.ts`, `serialize.ts`, `normalize.ts`, `adapters/`
