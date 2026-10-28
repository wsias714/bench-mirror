# File layout and schema

The app folder holds one file the app reads: `snapshot.json`, written only by the private job (one writer per file). The app's only write is a new file under `inbox/` (Dropbox mode `add`, no autorename, never an overwrite or edit) holding a TWM answer: `{"v":1,"id":"<uuid>","created":"<ISO>","kind":"twm_queue"|"twm_desk", ...}` (queue: `qid` plus `answer` or `accept_default`; desk: `set` plus `answers: {qid: {choice, note}}`). The private side validates and applies it, then moves it to `inbox/done/` or `inbox/rejected/` with a reason. This needs the Dropbox app's `files.content.write` scope; a login from before that shows "read-only, reconnect" and works after one sign-out and reconnect. Details: Bench's `docs/MIRROR.md`.

`snapshot.json` (schema 1): `generated_at`, `stale_after_min` (the header pill says "Stale" past it), `read_only`, `today` (counts, `top`, `outstanding`), `deck` (titles only), `week`, `twm`, `threads` (title, project, status, `needs_you`), `inbox`. Ids are opaque hashes. The file stays under 400 KB. The app caches the last good file in `localStorage` and labels it "Offline copy"; "Sign out / forget this device" erases it.

`parseSnapshot` rejects a file with a newer schema or a missing section instead of rendering part of it.
