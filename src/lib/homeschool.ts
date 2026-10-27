/* Pure helpers for the School tab. No browser imports, so node --test runs them. */
import type { HsSubject } from "./snapshot.ts";

export type Pace = "ahead" | "on" | "behind" | "far";

/** Where a subject sits against a steady pace. `expected` is the minutes a steady pace puts you at by today. */
export function pace(r: Pick<HsSubject, "logged" | "expected" | "target">): Pace {
  if (r.target <= 0 || r.logged >= r.expected) return r.logged > r.expected * 1.1 && r.expected > 0 ? "ahead" : "on";
  return r.logged >= r.expected * 0.75 ? "on" : r.logged >= r.expected * 0.4 ? "behind" : "far";
}

export const PACE_TEXT: Record<Pace, string> = { ahead: "ahead", on: "on pace", behind: "behind", far: "well behind" };

/** Bar widths as percentages of the target, capped at 100. */
export function bar(r: Pick<HsSubject, "logged" | "scheduled" | "expected" | "target">) {
  const t = r.target > 0 ? r.target : 1;
  const pct = (n: number) => Math.max(0, Math.min(100, Math.round((100 * n) / t)));
  const logged = pct(r.logged);
  return { logged, planned: Math.min(100 - logged, pct(r.logged + r.scheduled) - logged), tick: pct(r.expected) };
}

export const hours = (min: number) => (min >= 120 ? `${(min / 60).toFixed(1)}h` : `${min}m`);

/** Header pill for the Asana sync: when it last pulled, and whether the timer looks healthy.
 *  The timer runs every 30 min, so amber past 75 min and red past 3 h. */
export function syncState(s: { last_ingest_at: string | null; ok: boolean } | undefined, now = Date.now()): { kind: "ok" | "stale" | "bad" | "none"; min: number | null } {
  if (!s || !s.last_ingest_at) return { kind: "none", min: null };
  const t = Date.parse(s.last_ingest_at);
  if (Number.isNaN(t)) return { kind: "none", min: null };
  const min = Math.max(0, Math.round((now - t) / 60000));
  if (!s.ok || min > 180) return { kind: "bad", min };
  return { kind: min > 75 ? "stale" : "ok", min };
}
