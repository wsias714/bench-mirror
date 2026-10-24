# File layout and schema

The app folder holds one file the app reads: `snapshot.json`, written only by the private job (one writer per file). The app has a read-only login and never uploads. A reserved `inbox/` folder is for a possible later write path (create-only files, applied and deleted by the private side); nothing uses it yet.

`snapshot.json` (schema 1): `generated_at`, `stale_after_min` (the header pill says "Stale" past it), `read_only`, `today` (counts, `top`, `outstanding`), `deck` (titles only), `week`, `twm`, `threads` (title, project, status, `needs_you`), `inbox`. Ids are opaque hashes. The file stays under 400 KB. The app caches the last good file in `localStorage` and labels it "Offline copy"; "Sign out / forget this device" erases it.

`parseSnapshot` rejects a file with a newer schema or a missing section instead of rendering part of it.
