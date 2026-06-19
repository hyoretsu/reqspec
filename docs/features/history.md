# History

Every sent request is recorded locally.

## What it does

- On each **Send**, ReqSpec stores a snapshot: the request definition (as sent) and the
  normalized response (status, headers, body, cookies, timing, size).
- The History panel lists entries most-recent-first.

## How to use

- **Re-open** — click an entry to load its request back into the builder (as an unsaved
  scratch draft) along with its recorded response.
- **Delete one** — hover an entry and click ✕.
- **Clear all** — `Clear` in the History panel header (confirms first).

## Current limits

- History is capped at the most recent 100 entries in the list view.
- No search/filter over history yet.
- Re-opened entries load as scratch drafts; they are not auto-linked back to a saved request.

## Where it lives

- UI: `frontend/src/components/history/HistoryList/`
- Data: `frontend/src/lib/db/history.repo.ts`
