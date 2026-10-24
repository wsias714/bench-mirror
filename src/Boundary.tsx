import { Component } from "react";
import type { ReactNode } from "react";
import { clearCached } from "./lib/store.ts";

/** Reset without losing the Dropbox connection: clears the cached snapshot and the service worker. */
export async function resetApp() {
  try {
    clearCached();
    for (const r of (await navigator.serviceWorker?.getRegistrations?.()) ?? []) await r.unregister();
    for (const k of (await caches?.keys?.()) ?? []) await caches.delete(k);
  } catch {
    /* best effort */
  }
  window.location.reload();
}

export default class Boundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="app">
        <h1>Bench</h1>
        <p>Something broke while showing the snapshot.</p>
        <p className="err">{String(this.state.err.message).slice(0, 300)}</p>
        <p className="note">build {__BUILD__}</p>
        <button className="primary" onClick={() => void resetApp()}>Reset app and reload</button>
      </div>
    );
  }
}
