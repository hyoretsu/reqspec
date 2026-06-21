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
| Request body: raw (JSON/text) | ✅ | |
| Request body: x-www-form-urlencoded | ✅ | |
| Request body: form-data | 🟡 | text fields; file upload ❌ |
| Request body: GraphQL / binary | ❌ | |
| Response viewer (status/time/size) | ✅ | |
| Response body pretty/raw | 🟡 | JSON pretty-print; no syntax highlighting yet |
| Response headers / cookies | ✅ | |
| Response search / visualizations / save example | ❌ | |
| CORS-free sending | ✅ | native (Tauri) bypasses CORS; web is CORS-bound |

## Organize & reuse

| Feature | Status | Notes |
| --- | --- | --- |
| Collections | ✅ | |
| Folders (nesting) | 🟡 | stored + imported; flat in the M1 UI |
| Save requests | ✅ | |
| History | ✅ | re-open past sends |
| Environments + variables | ✅ | |
| Global variables | ✅ | |
| `{{variable}}` interpolation | ✅ | env > globals |
| Dynamic variables (`{{$guid}}`, …) | ❌ | |
| Secret/masked variables | ❌ | |
| Request description / docs (markdown) | ❌ | |
| Multiple request tabs | ❌ | single active request in M1 |

## Auth

| Feature | Status |
| --- | --- |
| Basic | ✅ |
| Bearer token | ✅ |
| API key | ❌ |
| OAuth 1.0 / 2.0 | ❌ |
| AWS Signature / Digest / NTLM / Hawk | ❌ |

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
| Pre-request scripts | ❌ | |
| Test scripts / assertions | ❌ | |
| Collection Runner + data files | ❌ | |
| Mock servers | ❌ | |
| Monitors | ❌ | |
| Cookie jar editor | ❌ | response cookies are shown read-only |
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

## Nearest-term gaps to close parity

1. Pre-request & test scripts (sandboxed JS) — the biggest functional gap.
2. More auth types (API key, OAuth 2.0).
3. Multiple request tabs + folder UI + drag-reorder.
4. Response syntax highlighting + search; save examples.
5. Export to Postman and cURL/OpenAPI import.
