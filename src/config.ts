/** Dropbox app key (public by design under PKCE: no secret). Register a Dropbox app with "App folder"
    access for this app, then set VITE_DROPBOX_APP_KEY at build time or paste it in Settings. */
export const DEFAULT_DROPBOX_APP_KEY: string = (import.meta.env.VITE_DROPBOX_APP_KEY || "").trim();
/** The one file Bench writes into the app folder. The phone reads it, and adds new files only under /inbox/. */
export const SNAPSHOT_PATH = "/snapshot.json";
