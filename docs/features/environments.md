# Environments & Variables

Reuse values across requests with `{{variable}}` placeholders.

## What it does

- **Environments** are named sets of variables (e.g. `Local`, `Staging`, `Production`).
- **Global variables** apply regardless of the selected environment.
- At send time, every `{{name}}` token in the URL, params, headers, body, and auth fields is
  replaced. **Precedence: environment > globals.** Unknown tokens are left as-is.
- Resolution is a single pass — a resolved value is not itself re-scanned for tokens.

## How to use

1. In the Environments panel, create an environment (`+ New`) and add `key`/`value` rows.
2. Select the active environment from the selector (top bar on desktop, Env panel on mobile).
   Choose **No environment** to use globals only.
3. Reference variables anywhere a value is accepted, e.g. `https://{{baseUrl}}/users` or a
   Bearer token of `{{token}}`.

Only enabled rows with a non-empty key contribute to the scope.

## Current limits

- No secret masking / encrypted storage of variable values yet.
- No per-request variable overrides or dynamic (scripted) variables yet.

## Where it lives

- UI: `frontend/src/components/environments/EnvironmentManager/`
- Logic: `frontend/src/lib/vars/interpolate.ts`, `frontend/src/lib/vars/scope.ts`
- Data: `frontend/src/lib/db/environments.repo.ts`
