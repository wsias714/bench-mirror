# CLAUDE.md

Public repo: code only. Read-only phone PWA (React + Vite) that shows a sanitized snapshot from a private Dropbox app folder. The writer, the sanitizing rules and the threat model live in the private Bench repo (`docs/MIRROR.md`), not here.

- Deploy: GitHub Pages on push to `main` (`.github/workflows/deploy.yml`, base `/bench-mirror/`). `npm run check` before every commit or push.
- Never commit data, real titles, names, emails, addresses, amounts, account numbers, hostnames, home-directory paths or secrets. Tests use made-up strings. Commit with the GitHub noreply address.
- Read-only: never add a Dropbox upload, move or delete call. Keep the strict CSP in `index.html` (no inline script, no third-party hosts).
