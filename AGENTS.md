> The sections below apply across every project that uses this `AGENTS.md` / `CLAUDE.md`.

## NEVER affect anything outside the local machine (absolute rule)

Never perform any action whose effect leaves this computer. No exceptions, ever, without an explicit per-instance request from the user.

Forbidden unless the user explicitly asks for that specific action:
- `git push` (or any push to a remote), creating/updating PRs, pushing tags.
- Running database migrations, schema pushes, seeds, or any command against a remote/shared/external database.
- Triggering CI/CD, deploys, or remote jobs; publishing packages; sending requests that mutate external services.

Local work is fine: edit files, run local builds/tests, commit locally. Stop at the local boundary and let the user push / migrate / deploy themselves. If a task seems to need crossing that boundary, describe the exact command and ask first.

## Git Commits — Required After Every Completed Task

After finishing any task (feature, fix, refactor, or guideline addition), always create a git commit with **the agent that did the work** as the author and the local user as the committer:

```
git -c commit.gpgsign=false -c user.name="Aran Leite" -c user.email="hyoretsu@gmail.com" commit --author="<Agent> <agent-email>"
```

Each agent authors under its **own** identity — never under another agent's or any other third-party identity. The committer is always `Aran Leite <hyoretsu@gmail.com>`. Examples:

- Claude → `--author="Claude <noreply@anthropic.com>"`
- Codex → `--author="Codex <noreply@openai.com>"`

If the user requests an adjustment to something just delivered, amend or rebase rather than creating a separate noisy commit — keep history clean. Use Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `style`, `chore`) with the area of change as scope when meaningful (e.g. `feat(auth)`, `fix(editor)`).

## Pre-PR / Pre-Merge Checks — Required Before Staging or Main

Before opening a PR or merging to `staging` or `main`, run both checks. Both must pass before proceeding.

- Type-check: `bun run check-types` (`tsc --noEmit`).
- Build: `bun run build` (`next build`).

The **`.githooks/pre-push`** hook runs both locally.

This is a local gate; running it never implies pushing or triggering CI — see the absolute local-boundary rule above.

## Serena — Required When Starting a Session

This project uses Serena. The full protocol is in `SERENA.md`/`@SERENA.md`.

**When starting any session, run these steps in order:**

1. Call `mcp__serena__initial_instructions` to read the Serena manual.
2. Call `mcp__serena__check_onboarding_performed`. If onboarding has not been performed, call `mcp__serena__onboarding`.
3. Before any work on code files, make Serena tools available. If Serena tools are not already visible in the active tool list, load them through `ToolSearch` first. Tool names may or may not have the `mcp__serena__` prefix depending on the agent/runtime.

Serena is PRIMARY for all TypeScript/TSX code. Built-in Read/Edit/Grep are SECONDARY — only use them when Serena fails or the target is not code.

## Caveman

Terse like caveman. Technical substance exact. Only fluff die.
Drop: articles, filler (just/really/basically), pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift.
Code/commits/PRs: normal. Off: "stop caveman" / "normal mode".

- Never put multiple components in the same file unless the file is intentionally using the Composition pattern. When a parent component needs private child components, turn it into a folder with `index.tsx`, move each child component to its own file, and place shared local types in `types.ts`.

## Component Architecture (Frontend)

- **Simple, componentized components.** Break out parts that make sense into their own components — avoid bloated components with multiple responsibilities.
- **Maximize reuse — design-system mindset.** Aggressively extract primitives (Container, Section, IconBadge, CheckList, SectionHeading, etc.) whenever a layout/presentation pattern repeats, even within a single page. Generic primitives go in `src/components/ui/`; domain composites go in `src/components/<feature>/`. When in doubt, extract.
- **Component file naming in CamelCase (PascalCase).** Component files use PascalCase: `AuthTabs.tsx`, `LoginForm.tsx`, `FormField.tsx`. Files that are not components (utils, hooks, configs) stay in kebab-case.
- **Page component co-location.** If a component is only used by one page (or a single parent component), place it in a `components/` folder adjacent to the file that uses it. Always create an `index.ts` barrel inside that folder. Example: `app/auth/components/AuthTabs.tsx` + `app/auth/components/index.ts`.
- **Fetch data in the deepest possible component.** The request belongs in the component that actually consumes the data. Only lift it to the parent if another sibling also needs the same data.
- **Static export + Tauri.** reqspec runs as `output: "export"` targeting Tauri desktop. The bundle is 100% client-side — RSC applies only to static build-time rendering; dynamic server features (cookies, headers, DB access) are unavailable at runtime. Treat all data fetching as client-side. Keep `"use client"` at the smallest possible scope — only add it when there is state, an effect, an event handler, or a browser API.
- **No `React.` namespace.** Never use `import * as React from "react"` or qualify types/hooks with `React.X`. Import everything by name: `import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react"`. `FormEvent`/`FormEventHandler` are deprecated in current typings — prefer an inline `onSubmit` handler so the type is inferred.
- **No `<input type="number">`.** Numeric inputs are better implemented as `type="text"` with explicit parsing and validation — `type="number"` has poor UX (scroll-to-change, inconsistent browser behavior, broken paste). Use `inputMode="numeric"` or `inputMode="decimal"` for mobile keyboard hints, parse the value with `parseFloat`/`parseInt` on change or blur, and store it as a string in local state until submission.
- **Always add masks and placeholders.** Every input that accepts a structured value (currency, percentage, date, phone, document number) must use a formatting mask. Every input must have a `placeholder` that shows a realistic example of the expected format. Raw bare inputs with no context are not acceptable.
- **Always debounce text inputs.** Every `<input type="text">` and `<textarea>` must use a debounced input hook — it keeps a local state that updates immediately (preserving the browser's native undo/Ctrl+Z history) and debounces the parent `onChange` callback (default 300 ms). Without this, each keystroke triggers a parent re-render that resets the browser undo stack. If the hook doesn't exist yet, create it at `src/hooks/use-debounced-input.ts`. For list rows, extract a row component so each row has its own local state.
- **No `alert()` or `confirm()`.** Native browser dialogs block the JS thread, ignore the app's theme, and cannot be styled. Use imperative modal helpers that return Promises instead — if they don't exist yet, create them before reaching for native dialogs.
- **No native `<select>`.** Native selects have inconsistent cross-browser styling and a cramped arrow affordance. Use a custom select component with a portal-based popover (`createPortal` + `position: fixed`) so it escapes `overflow: hidden/auto` containers (e.g. modals). If `src/components/ui/CustomSelect.tsx` doesn't exist yet, create it. Never wrap the select trigger in a `<label>` since the trigger is a button, not an input.
- **No ghost (borderless) buttons.** Never render a button without a visible border. A ghost/borderless button is invisible at rest — users can't tell it's interactive. Reserve ghost/borderless style only for icon-only toolbar buttons where the icon itself communicates interactivity, and even then ensure a clear hover background.

## Test File Placement

- **Unit tests** live **next to the file under test** — `Foo.ts` → `Foo.test.ts` in the same directory.
- **Integration / E2E tests** (multiple units or cross-module flows) live in a `tests/` folder within the relevant module.
- **Never** name the folder `__tests__` (or any `__…__` form). The folder is always plainly named `tests`.
- Tests use `bun:test` and `bun test`.
