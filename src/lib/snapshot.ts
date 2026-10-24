/* The snapshot Bench writes (src/mirror.py, schema 1) and the pure helpers the UI uses.
   Kept free of browser imports so it runs under `node --test`. */
export interface Ev { id: string; title: string; domain: string; due: string; days: number | null; bucket: string }
export interface Card { id: string; kind: string; title: string; domain: string; outcome: string; created: string }
export interface Thread { title: string; project: string; status: string; needs_you: boolean }
export interface Twm {
  available: boolean; as_of?: string; running?: boolean; paused?: boolean;
  last_run?: { ts: string; ok: boolean | null; ended: string }; next_run?: string;
  digest?: { title: string; health: string; moved: string[] };
  weekly_verdict?: string;
  decisions_waiting?: { id: string; q: string; due: string }[];
  decisions_council?: string[];
}
export interface Snapshot {
  schema: number; generated_at: string; stale_after_min: number; read_only: boolean;
  today: { counts: { overdue: number; upcoming: number; active: number }; top: Ev[]; outstanding: Ev[] };
  deck: Card[]; week: Ev[]; twm: Twm;
  threads: { as_of: string; error: string; needs_you: number; items: Thread[] };
  inbox: { dir: string; accepts: string[]; applied: string[] };
}

export const SUPPORTED_SCHEMA = 1;

/** Parse and check a snapshot. Throws a readable error rather than rendering a half-shape. */
export function parseSnapshot(text: string): Snapshot {
  const s = JSON.parse(text) as Partial<Snapshot>;
  if (!s || typeof s !== "object" || typeof s.schema !== "number") throw new Error("snapshot.json has no schema field");
  if (s.schema > SUPPORTED_SCHEMA) throw new Error(`snapshot schema ${s.schema} is newer than this app (${SUPPORTED_SCHEMA}); reload to update`);
  if (!s.today || !s.deck || !s.week || !s.twm || !s.threads) throw new Error("snapshot.json is missing a section");
  return s as Snapshot;
}

/** Minutes since the snapshot was generated (null when the stamp is unreadable). */
export function ageMinutes(s: Pick<Snapshot, "generated_at">, now = Date.now()): number | null {
  const t = Date.parse(s.generated_at);
  return Number.isNaN(t) ? null : Math.max(0, Math.round((now - t) / 60000));
}

export function isStale(s: Pick<Snapshot, "generated_at" | "stale_after_min">, now = Date.now()): boolean {
  const a = ageMinutes(s, now);
  return a === null || a > (s.stale_after_min || 45);
}

export function agoLabel(min: number | null): string {
  if (min === null) return "unknown";
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (min < 60 * 24) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
}

export function dueLabel(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return "today";
  return days === 1 ? "tomorrow" : `in ${days}d`;
}

/** What the header pill says: off / syncing / live / stale / offline cache. */
export function pill(o: { connected: boolean; loading: boolean; error: string; snap: Snapshot | null; fromCache: boolean }, now = Date.now()): { kind: "off" | "syncing" | "ok" | "stale" | "offline" | "error"; text: string } {
  if (!o.connected) return { kind: "off", text: "Not connected" };
  if (o.loading && !o.snap) return { kind: "syncing", text: "Loading…" };
  if (o.snap) {
    const a = agoLabel(ageMinutes(o.snap, now));
    if (o.fromCache) return { kind: "offline", text: `Offline copy · ${a}` };
    return isStale(o.snap, now) ? { kind: "stale", text: `Stale · ${a}` } : { kind: "ok", text: `Updated ${a}` };
  }
  return { kind: "error", text: o.error || "No snapshot yet" };
}
