# Bench Mirror

A read-only phone view of a personal task console: today's and outstanding items, an approval queue, this week's deadlines, one project's status and thread status. A static PWA on GitHub Pages that needs no VPN.

**No data lives in this repo or on any public URL.** The app is code only. The data is a single file that a private job writes to a private Dropbox app folder; the app reads it with Dropbox OAuth (PKCE, refresh token, no secret). Without the owner's Dropbox login the page shows nothing.

- Develop: `npm ci`, `npm run dev`. Before every commit: `npm run check` (tests, typecheck, build).
- File layout and schema: [docs/capture-and-sync.md](docs/capture-and-sync.md).
- Sign-in: open the page, tap the gear, paste the Dropbox app key if it isn't built in, tap Connect Dropbox, approve. If Dropbox doesn't return to the app, use "Get a code".
- Sign out: Settings, "Sign out / forget this device". It revokes the Dropbox token and erases the cached snapshot, tokens, app key and service worker from the device.

## Page hardening
Strict Content-Security-Policy (no inline script or style, no third-party scripts or analytics, network limited to the two Dropbox API hosts), `noindex, nofollow`, `Referrer-Policy: no-referrer` (via meta), `robots.txt` disallowing all. The Dropbox refresh token is kept in `localStorage`, the narrowest store that survives closing a home-screen app (session storage is wiped on every launch and a cookie would be sent to the server). The Dropbox app is scoped to its own app folder only.

## Rules for contributors
No real snapshot, sample or screenshot with real data, ever (`snapshot*.json` is git-ignored; tests use made-up strings). No names, emails, addresses, amounts, account numbers, hostnames or file paths in code, docs or commits. No Dropbox app secret. Commits use the GitHub noreply address.
