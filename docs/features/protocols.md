# Protocols (M9 — foundation + WebSocket)

ReqSpec is no longer HTTP-only: requests carry a `protocol` discriminant so storage,
the builder, and tabs are protocol-agnostic. M9 ships the seam plus the first
connection-oriented protocol, **WebSocket**. Socket.IO, MQTT, and gRPC are deferred
to M9b (their selector entries render a placeholder).

## The seam

`RequestModel` (`lib/request/model.ts`) gains:

- `protocol: ProtocolKind` — one of `http | graphql | websocket | socketio | mqtt | grpc`,
  defaulting to `http`. **A stored request without the field is treated as `http`**, so
  pre-M9 rows keep working with no migration.
- `websocket?: WebSocketConfig` — present when `protocol === "websocket"`: handshake
  `protocols` (subprotocols), `messageFormat` (`text`/`json`), and the persisted composer
  `draft` (survives tab/session switches).

`createEmptyWebSocketRequest()` builds a blank WebSocket request. HTTP keeps its existing
shape untouched, so the send pipeline, history, and runner are unaffected.

## WebSocket

Pure logic — `lib/protocols/websocket.ts` (no I/O, 100% line+function coverage):

- `normalizeWsUrl` / `isValidWsUrl` — upgrade `http(s)→ws(s)`, default bare hosts to `ws://`,
  validate the result.
- `makeLogEntry` — build an in/out/system log entry (id + timestamp).
- `validateOutgoing` — pass `text` through; parse + canonicalize `json`, reporting errors.
- `canSend` / `canConnect` / `statusLabel` — status predicates + labels for the UI.

Live wiring — `lib/store/ws.store.ts` (glue): a zustand store keyed by connection id
(`requestId ?? "scratch"`) holding per-connection `status` + message `log`. It opens a browser
`WebSocket` (works in the web app and the Tauri webview — WebSocket is not subject to CORS),
maps its events onto status transitions + log appends, and exposes `connect`/`send`/
`disconnect`/`clear`. Sockets are held in a module-level `Map` so React state stays
serializable.

UI — `components/protocols/WebSocketPanel/`:

- `index.tsx` — endpoint input + Connect/Disconnect, status pill, subprotocols field; reads/
  writes the active request's `url` + `websocket` config via `patchDraft` (so Save persists it).
- `MessageComposer.tsx` — format picker + payload textarea + validated Send.
- `MessageLog.tsx` — scrollable in (↓) / out (↑) / system (•) log with timestamps + Clear.

`RequestBuilder` branches on `draft.protocol`: HTTP renders the existing request/response
builder; `websocket` renders `WebSocketPanel`; other kinds render a "coming in a later
milestone" placeholder. A protocol picker in the builder header switches kinds, and a 🔌
action on collection/folder rows creates a WebSocket request. The collections tree shows a
`WS` tag instead of an HTTP method badge for non-HTTP requests.

## Deferred (M9b)

- **Socket.IO** (`socket.io-client`): event name + payload, listeners.
- **MQTT** (`mqtt` over WebSocket on web / native TCP via Tauri): topic subscribe/publish.
- **gRPC**: proto import + reflection; native via Rust `tonic` behind Tauri commands
  (unary + streaming), `grpc-web` on the web.
- Native WebSocket via a Tauri plugin (the browser `WebSocket` already covers both targets,
  so this is only needed if raw TCP / custom headers become necessary).
