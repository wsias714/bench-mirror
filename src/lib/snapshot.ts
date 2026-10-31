/* The snapshot Bench writes (src/mirror.py, schema 1) and the pure helpers the UI uses.
   Kept free of browser imports so it runs under `node --test`. */
export interface Ev { id: string; title: string; domain: string; due: string; days: number | null; bucket: string }
export interface Card { id: string; kind: string; title: string; domain: string; outcome: string; created: string }
export interface Thread { title: string; project: string; status: string; needs_you: boolean }
export interface TlItem { id: string; title: string; domain: string; due: string; days: number | null; lead: number }
export interface Timeline { days: number; ahead: TlItem[]; overdue: TlItem[]; overdue_total: number }
export interface HistoryRow { ts: string; ok: boolean | null; moved: number | null; plan_only: boolean; ended: string; mins: number | null; calls: number | null; cost: number | null }
export interface DeliveryRow { c0: string; c1: string; c2?: string; c3?: string; status: string; status_text: string }
export interface Delivery {
  out_of_date?: string;
  available: boolean; updated?: string; summary?: string;
  next14?: DeliveryRow[]; milestones?: DeliveryRow[]; asks?: DeliveryRow[];
  roadblocks?: { n: number; title: string; lines: { depth: number; text: string }[] }[];
}
export interface TlBullet { depth: number; text: string }
export interface TlRow { c0: string; c1: string; c2: string; c3: string; status: string; status_text: string }
export interface Timeline12 {
  available: boolean; status?: string; status_note?: string; goal?: string[]; goal_items?: TlBullet[]; tracks?: TlBullet[];
  sprints?: { title: string; end: string; rows: TlRow[]; notes: string[] }[]; current?: number;
  months23?: TlRow[]; quarters?: { title: string; items: TlBullet[] }[]; critical?: TlBullet[];
}
export interface DeskQuestion { id: string; section: string; text: string; why: string; lean: string; options: string[]; answer: { choice: string; note: string } | null }
export interface Desk { available: boolean; id?: string; kind?: string; title?: string; intro?: string; due?: string; questions?: DeskQuestion[] }
export interface BoardBlock { goal: string; done: string; status: string; status_text: string }
export interface BoardSeg { start: string; end: string; blocks: Record<string, BoardBlock | string | string[]> }
export interface Board {
  available: boolean; today?: string; lanes?: string[];
  strip?: {
    decisions: { queue: number; desk: number; total: number };
    sprint: { n: number; day: number; of: number; goals: { lane: string; status: string }[] } | null;
    milestone: { name: string; date: string; days: number; wade: boolean } | null;
    health: { last: string; ended: string; nights: number; of: number; days: { date: string; state: string; ended: string }[] };
  };
  sprints?: (BoardSeg & { n: number; current: boolean })[];
  months?: (BoardSeg & { label: string })[];
  quarters?: (BoardSeg & { title: string })[];
  milestones?: { date: string; name: string; wade: boolean; status: string; source: "delivery" | "timeline" }[];
  stages?: { stage: string; window: string; status: string }[];
}
export interface Feedback { id: string; file: string; where: string; item: string; text: string; status: "open" | "answered"; answered: string; answer: string }
export interface Surfaces { available: boolean; night?: string; ok?: boolean; surfaces?: { surface: string; ok: boolean; why: string }[] }
export interface Twm {
  board?: Board; feedback?: Feedback[]; surfaces?: Surfaces;
  available: boolean; as_of?: string; running?: boolean; paused?: boolean;
  failures?: { consecutive: number | null; stop_after: number | null }; builds?: boolean; model?: string;
  last_run?: { ts: string; ok: boolean | null; moved?: number | null; ended: string }; next_run?: string;
  digest?: { title: string; health: string; moved: string[]; by_role?: Record<string, string[]>; next?: string[]; notices?: string[] };
  weekly_verdict?: string;
  plan?: { updated: string; goal: string; standing: string[] };
  history?: HistoryRow[];
  health?: {
    green: boolean | null; tier: string; head: string; at: string; first_failure: string;
    checks: { id: string; status: string }[]; phase: { current: number | null; total: number | null; pct: number | null; title: string };
    probes_red: number; probes_total: number | null; pivots: number | null; unmerged: { headline: string; date: string }[];
  };
  delivery?: Delivery;
  timeline?: Timeline12;
  decisions_waiting?: { id: string; q: string; due: string; class?: string; default?: string; answer?: string }[];
  desk?: Desk;
  decisions_recent?: { id: string; status: string; q: string }[];
  decisions_council?: string[];
}
export interface HsSubject { subject: string; logged: number; scheduled: number; target: number; expected: number }
export interface HsDay { date: string; weekday: string; total: number; confirmed: number; pending: number; minutes: number; work_sample: boolean }
export interface HsRecord { date: string; type: string; program: string; subjects: string[]; minutes: number; status: string; work_sample: boolean; has_file: boolean; future: boolean; text: string }
export interface LpStudent {
  label: string; activities: number; days: number; minutes: number; samples_on_file: number; samples_required: number;
  subjects: { subject: string; minutes: number; target: number; required: boolean }[];
  classes: { name: string; schedule: string; sessions: number; minutes: number }[];
  samples: { date: string; subjects: string[]; activity: string }[];
  log: { date: string; activity: string; subjects: string[]; minutes: number }[];
}
export interface LpReport { lp: { id: string; label: string; start: string; end: string; total_days: number }; through: string; students: LpStudent[] }
export interface LpSubmit {
  lp: string; ready: boolean; plan_hash: string;
  mapping_count?: number;
  last?: { outcome: string; at: string; placed: number; who: string; reason: string[] } | null;
  candidates: { key: string; date: string; subject: string; picked: boolean; complete: boolean; pickable: boolean; reason: string; flag?: string }[];
  checks: { label: string; ok: boolean }[];
  files: { samples: number; reports: number; already_there: number };
}
export interface Homeschool {
  available: boolean;
  lp?: { label: string; start: string; end: string; elapsed_days: number; total_days: number } | null;
  lp_subjects?: HsSubject[];
  work_samples?: { required: number; have: number; by_subject: { subject: string; n: number }[] };
  drive?: { files: number; linked: number; unmatched: number; undated: number; listing_age_min: number | null; by_subject: { subject: string; files: number; unmatched: number }[] } | null;
  week?: { start: string; end: string; pct: number; pending: number; subjects: HsSubject[]; days: HsDay[] };
  lp_report?: LpReport | null;
  submit?: LpSubmit | null;
  records?: { total: number; rows: HsRecord[] } | null;
  sync?: { last_ingest_at: string | null; last_attempt_at: string | null; added: number; ok: boolean; skipped: string | null };
}
export interface Snapshot {
  schema: number; generated_at: string; stale_after_min: number; read_only: boolean;
  today: { counts: { overdue: number; upcoming: number; active: number }; top: Ev[]; outstanding: Ev[] };
  deck: Card[]; week: Ev[]; timeline?: Timeline; twm: Twm; homeschool?: Homeschool;
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
