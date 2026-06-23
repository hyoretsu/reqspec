# Postman Feature Parity

Honest assessment of where ReqSpec stands against Postman. Legend:
✅ at parity · 🟡 partial · ❌ not yet · ➖ intentionally out of scope.

## Verdict

ReqSpec is at parity for the **core request → response → organize → reuse** loop that most
day-to-day API work depends on, and it **imports existing Postman collections and
environments** so users can switch without losing work. Postman's advanced surface (scripting,
runner, mocks/monitors, extra protocols, non-HTTP auth schemes) is not yet built. Cloud
collaboration is deliberately out of scope except for the paid sync IAP.

## Core HTTP workflow

| Feature | Status | Notes |
| --- | --- | --- |
| Send HTTP request (all methods) | ✅ | GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS |
| Query params (enable/disable) | ✅ | |
| Headers (enable/disable) | ✅ | |
| Request body: raw (JSON/text) | ✅ | raw + **visual JSON tree builder**, prettify/minify/validate |
| Request body: x-www-form-urlencoded | ✅ | |
| Request body: form-data | ✅ | text + **file** fields (per-row text/file toggle) |
| Request body: GraphQL | ✅ | query + variables (tree or raw) |
| Request body: binary | ✅ | single file, content-type override |
| JSON datetime fields (ISO 8601 / Unix) | ✅ | format specifier in the JSON builder |
| Insert `{{var}}` / dynamic into values | ✅ | |
| Response viewer (status/time/size) | ✅ | |
| Response body pretty/raw | 🟡 | JSON pretty-print; no syntax highlighting yet |
| Response headers / cookies | ✅ | |
| Response search / visualizations / save example | ❌ | |
| CORS-free sending | ✅ | native (Tauri) bypasses CORS; web is CORS-bound |

## Organize & reuse

| Feature | Status | Notes |
| --- | --- | --- |
| Collections | ✅ | |
| Folders (nesting) | ✅ | create/rename/delete in the tree |
| Drag-reorder (collections/requests) | ✅ | @dnd-kit |
| Save requests | ✅ | |
| Request duplicate / rename | ✅ | |
| Local workspaces | ✅ | switch in the top bar; collections/envs scoped |
| Saved response examples | ✅ | re-openable as tabs |
| History | ✅ | re-open past sends |
| Environments + variables | ✅ | |
| Global variables | ✅ | |
| `{{variable}}` interpolation | ✅ | local > data > env > collection > global |
| Collection-scoped variables | ✅ | per-collection editor |
| Dynamic variables (`{{$guid}}`, …) | ✅ | guid/timestamp/random* set |
| Secret/masked variables | ✅ | per-variable secret toggle |
| Request description / docs (markdown) | ✅ | Docs tab, sanitized preview |
| Multiple request tabs | ✅ | persisted per workspace |
| Command palette / global search | ✅ | Cmd/Ctrl+K |
| Keyboard shortcuts | ✅ | send / save / new tab |

## Auth

| Feature | Status |
| --- | --- |
| Basic | ✅ |
| Bearer token | ✅ |
| API key (header / query) | ✅ |
| OAuth 2.0 (client-credentials / password / token) | ✅ |
| OAuth 2.0 (interactive auth-code + PKCE) | ❌ (needs redirect infra) |
| AWS Signature v4 | ✅ |
| OAuth 1.0 / Digest / NTLM / Hawk | ❌ |

## Import / export & interop

| Feature | Status | Notes |
| --- | --- | --- |
| Import Postman collection (v2.1) | ✅ | folders, requests, body, auth, variables |
| Import Postman environment | ✅ | |
| Import multiple files at once | ✅ | |
| Export to Postman | ❌ | |
| Import OpenAPI / cURL / HAR / Insomnia | ❌ | |
| Code generation (curl/snippets) | ❌ | |

## Automation & advanced

| Feature | Status | Notes |
| --- | --- | --- |
| Pre-request scripts | ✅ | QuickJS sandbox, `pm` API, mutate request + variables, `pm.sendRequest` |
| Test scripts / assertions | ✅ | `pm.test` + chai-subset `pm.expect`, Test Results + Console tabs |
| Collection Runner + data files | ❌ | |
| Mock servers | ❌ | |
| Monitors | ❌ | |
| Cookie jar editor | ✅ | auto-capture Set-Cookie, auto-send, per-domain manager |
| Proxy / SSL cert config | ❌ | |

## Protocols beyond HTTP

| Feature | Status |
| --- | --- |
| GraphQL / gRPC / WebSocket / Socket.IO / MQTT | ❌ |

## Platform & collaboration

| Feature | Status | Notes |
| --- | --- | --- |
| Offline-first | ✅ | exceeds Postman (fully local) |
| Desktop (Tauri) | ✅ | |
| Mobile (iOS/Android) | ✅ | Postman has no first-class mobile client |
| Web | ✅ | |
| Dark mode | ✅ | |
| Cloud sync across devices | ➖ | planned as the paid IAP |
| Workspaces / teams / comments / forking | ➖ | cloud collaboration, out of scope |

## Roadmap

Full sequenced plan: `~/.claude/plans/this-app-is-basically-peppy-floyd.md`.
M2 (workspaces, tabs, folders, docs, examples, search), M3 (variable scopes,
dynamic vars, secret vars, cookie jar), M4 (API key, AWS SigV4, OAuth 2.0
non-interactive), M5 (body parity), and M6 (scripting) are **done**. Next:

1. **M7–M10** — runner, mocks, protocols (WS/gRPC/MQTT/Socket.IO), export/codegen/response polish.
2. **Deferred auth** — OAuth 2.0 interactive auth-code+PKCE (redirect infra), Digest, NTLM, Hawk.

**M6** ships pre-request & test scripts in a lazily-loaded QuickJS WASM sandbox
(`quickjs-emscripten`, no startup cost when a request has no scripts). The `pm` API runs
as an in-VM shim bridged to a tested host engine (`lib/scripting/pm.ts`): variable scopes
(get/set/unset/has, Postman precedence), `pm.request` mutation, `pm.response`,
`pm.test` + a chai-subset `pm.expect` (`lib/scripting/expect.ts`), `pm.sendRequest`, and
`console.*`. Pre-request runs before serialize (mutating request + vars); tests run after
normalize. Script variable writes persist back to environment/globals/collection stores.
A Scripts tab (pre-request/test editors + snippets) and Test Results + Console tabs in the
response viewer surface the results. The VM has no host globals and a 5s interrupt guard.

M5a (visual JSON builder, datetime/format fields, insert-variable, GraphQL,
prettify/validate) and M5b (form-data file upload + binary body, via a
session-only in-memory file store — files aren't persisted across reloads) are
**done**.
