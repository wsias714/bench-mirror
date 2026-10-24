import { Dropbox, DropboxAuth } from "dropbox";
import { DEFAULT_DROPBOX_APP_KEY } from "../config.ts";
import type { Remote, RemoteFile } from "./remote.ts";
import { summary } from "./dbxerr.ts";
import type { DbxError } from "./dbxerr.ts";
export { describeError, isAuthError } from "./dbxerr.ts";

/* Dropbox adapter: OAuth PKCE (no secret anywhere), refresh-token based, scoped by the
   Dropbox app itself to its own app folder ("App folder" access). READ-ONLY: this file
   never uploads, moves or deletes. */

const K = { appKey: "bm-dbx-appkey", tokens: "bm-dbx-tokens", verifier: "bm-dbx-verifier" };

const get = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const put = (k: string, v: string | null) => {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, v);
  } catch {
    /* private mode etc.: the connection just won't persist */
  }
};

export const getAppKey = () => (get(K.appKey) || DEFAULT_DROPBOX_APP_KEY).trim();
export const setAppKey = (k: string) => put(K.appKey, k.trim() || null);

/** Must match a redirect URI registered in the Dropbox app console exactly. */
export const redirectUri = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

interface Tokens { refresh: string }
const tokens = (): Tokens | null => {
  const raw = get(K.tokens);
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as Tokens;
    return t.refresh ? t : null;
  } catch {
    return null;
  }
};

export const isConnected = () => !!tokens() && !!getAppKey();

/** Sign out and forget this device: revoke the token at Dropbox (best effort, it also kills the refresh
    token), then wipe every trace here: tokens, app key, PKCE verifier, the cached snapshot, the service
    worker and its caches. Nothing about Bench stays on the phone. */
export async function signOut(): Promise<void> {
  try {
    if (tokens()) await client().authTokenRevoke();
  } catch {
    /* offline or already revoked: still wipe locally; revoke from dropbox.com/account/connected_apps */
  }
  try {
    for (const k of Object.values(K)) put(k, null);
    window.localStorage.removeItem("bm-snapshot");
    window.localStorage.removeItem("bm-tab");
    window.sessionStorage.clear();
    for (const r of (await navigator.serviceWorker?.getRegistrations?.()) ?? []) await r.unregister();
    for (const c of (await caches?.keys?.()) ?? []) await caches.delete(c);
  } catch {
    /* best effort */
  }
}

/** Step 1: send the user to Dropbox. `manual` uses the copy-the-code flow (no redirect). */
export async function startAuth(manual = false): Promise<string> {
  const auth = new DropboxAuth({ clientId: getAppKey() });
  // token_access_type=offline gives a refresh token; scopes are whatever the Dropbox app is set to.
  const url = await auth.getAuthenticationUrl(manual ? "" : redirectUri(), manual ? undefined : "bm", "code", "offline", undefined, "none", true);
  // localStorage, not sessionStorage: iOS may hand the redirect back to a fresh webview.
  put(K.verifier, auth.getCodeVerifier());
  return String(url);
}

async function exchange(code: string, withRedirect: boolean): Promise<void> {
  const auth = new DropboxAuth({ clientId: getAppKey() });
  auth.setCodeVerifier(get(K.verifier) ?? "");
  const res = await auth.getAccessTokenFromCode(withRedirect ? redirectUri() : "", code.trim());
  const refresh = (res.result as { refresh_token?: string }).refresh_token;
  if (!refresh) throw new Error("Dropbox didn't return a refresh token. Check the app allows offline access.");
  put(K.tokens, JSON.stringify({ refresh } satisfies Tokens));
  put(K.verifier, null);
}

/** Step 2a: on page load, finish a redirect flow if the URL carries ?code=. */
export async function finishAuthFromUrl(): Promise<"none" | "connected"> {
  const p = new URLSearchParams(window.location.search);
  const code = p.get("code");
  if (!code || p.get("state") !== "bm") return "none";
  window.history.replaceState({}, "", redirectUri());
  await exchange(code, true);
  return "connected";
}

/** Step 2b: paste-the-code fallback (the redirect can fail to return into a home-screen app). */
export async function finishAuthWithCode(code: string): Promise<void> {
  await exchange(code, false);
}

function client(): Dropbox {
  const t = tokens();
  if (!t) throw new Error("Not connected to Dropbox.");
  return new Dropbox({ auth: new DropboxAuth({ clientId: getAppKey(), refreshToken: t.refresh }) });
}

const isNotFound = (e: unknown) => (e as DbxError)?.status === 409 && summary(e).includes("not_found");

export function dropboxRemote(): Remote {
  const dbx = client();
  return {
    async read(path): Promise<RemoteFile | null> {
      try {
        const res = await dbx.filesDownload({ path });
        const blob = (res.result as unknown as { fileBlob: Blob }).fileBlob;
        return { text: await blob.text(), rev: res.result.rev };
      } catch (e) {
        if (isNotFound(e)) return null;
        throw e;
      }
    },
  };
}
