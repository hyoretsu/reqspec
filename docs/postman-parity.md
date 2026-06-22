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
| Pre-request scripts | ❌ | |
| Test scripts / assertions | ❌ | |
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
dynamic vars, secret vars, cookie jar), and M4 (API key, AWS SigV4, OAuth 2.0
non-interactive) are **done**. Next:

1. **M5** — body parity (GraphQL, file upload, binary).
2. **M6** — pre-request & test scripts (QuickJS) — the biggest functional gap.
3. **M7–M10** — runner, mocks, protocols (WS/gRPC/MQTT/Socket.IO), export/codegen/response polish.
4. **Deferred auth** — OAuth 2.0 interactive auth-code+PKCE (redirect infra), Digest, NTLM, Hawk.
