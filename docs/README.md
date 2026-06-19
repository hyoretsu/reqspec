# ReqSpec — Documentation

ReqSpec is an offline-first API client (a Postman-style tool) that runs as one codebase
across web, mobile, and desktop (Tauri 2). Every feature works fully offline; only cloud
**sync** is a paid in-app purchase.

## Milestone 1 — feature index

| Feature | Doc |
| --- | --- |
| Collections & requests | [features/collections.md](features/collections.md) |
| Request builder | [features/requests.md](features/requests.md) |
| Environments & variables | [features/environments.md](features/environments.md) |
| History | [features/history.md](features/history.md) |
| HTTP execution (native vs web) | [features/http-execution.md](features/http-execution.md) |
| Local storage & offline model | [features/storage.md](features/storage.md) |

## Architecture

See [architecture.md](architecture.md) for the layering and state-management model.

> Keep these docs in sync as features land — each shipped capability gets an entry.
