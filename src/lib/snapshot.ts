/* The snapshot Bench writes (src/mirror.py, schema 1) and the pure helpers the UI uses.
   Kept free of browser imports so it runs under `node --test`. */
export interface Ev { id: string; title: string; domain: string; due: string; days: number | null; bucket: string; notes?: number; noted?: string; note_list?: { at: string; by: string; text: string }[]; respaced_from?: string }
export interface Card { id: string; kind: string; title: string; domain: string; outcome: string; created: string; will?: string }
export interface Thread { title: string; project: string; status: string; needs_you: boolean }
/** A thread the keep-moving pass started: a fixed state word and the date it was set; no thread text. */
export interface PassRow { title: string; state: string; since: string; moved_on: boolean }
/** The briefing's numbered "Needs your OK" list: plain title, what it changes, the Chief of Staff's verdict word. Read-only. */
export interface HkItem { n: number; title: string; change: string; verdict: string }
export interface Housekeeping { day: string; items: HkItem[]; more: number; stale: number; fixed: number }
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
export interface DeskAction { id: string; kind: "decision" | "checkin" | "pdf" | "link" | "task"; title: string; context?: string; action: string; due: string; qid: string; set: string; status: string; waiting_days: number; nudge: boolean; pdf: boolean }
export interface DeskActions { available: boolean; generated?: string; waiting?: number; hidden_private?: number; items?: DeskAction[] }
export interface Twm {
  actions?: DeskActions;
  board?: Board; feedback?: Feedback[]; surfaces?: Surfaces;
  available: boolean; as_of?: string; running?: boolean; paused?: boolean;
  failures?: { consecutive: number | null; stop_after: number | null }; builds?: boolean; model?: string;
  last_run?: { ts: string; ok: boolean | null; moved?: number | null; ended: string }; next_run?: string;
  night?: { level: string; line: string };
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
  decisions_waiting?: { id: string; q: string; due: string; class?: string; default?: string; answer?: string; body?: string[]; meaning?: string }[];
  desk?: Desk;
  decisions_recent?: { id: string; status: string; q: string; body?: string[]; answer?: string; meaning?: string }[];
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
/** Unmatched worksheets and the entries each could map to (Bench src/hs_attach.py): opaque ids, no file or child names. */
export interface HsAttachEntry { id: string; date: string; type: string; program: string; minutes: number; text: string; worksheet: boolean }
export interface HsAttach { items: { id: string; subject: string; date: string; entries: HsAttachEntry[] }[]; more: number }
export interface Homeschool {
  available: boolean;
  attach?: HsAttach | null;
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
/** State of everything (Bench `state`): one row per domain plus System. `next.title` is null for a withheld domain. Read-only. */
export type StateColor = "red" | "amber" | "green" | "grey";
export interface StateRow {
  key: string; label: string; color: StateColor; why: string;
  next: { title: string | null; due: string; days: number | null } | null;
  overdue: number; in_window: number; ready_for_you: number; to_confirm: number;
  last_touched: string | null; data_as_of: string | null;
}
export interface StateView {
  available: boolean; generated_at?: string; rows?: StateRow[];
  system?: { color: StateColor; why: string; checks: { name: string; ok: boolean; detail: string }[] };
}
/** What waits on Wade (Bench src/needs.py): the same list the 06:00 email and `cos needs` show. Read-only. */
export interface NeedCard {
  id: string; kind: string; title: string; context: string; reply: string; since: string; due: string; more?: string; tab?: string; group?: string;
  notes?: number; noted?: string; note_list?: { at: string; by: string; text: string }[];
  /** The checklist's buttons (Bench src/needs_act.py): fixed label and what it does. */
  actions?: NeedAction[];
  /** The card's version (a short hash); sent back with a choice so a changed card is not acted on blindly. */
  fp?: string;
  /** Chosen days ago but still listed (stuck), or a last try that did not go through. */
  decided?: { at: string; label: string }; last_try?: { at: string; label: string; message: string };
  /** Private placeholder (Bench 2026-11-19): its text stays at the desk. held_back names the buttons not offered here,
      lock says why. A held command shows its command and folder (redacted and pii-guarded by Bench). */
  private?: boolean; held_back?: string[]; lock?: string; command?: string; cwd?: string;
  /** A project page's steps for Wade, one line each (Bench 2026-11-19 evening: the card names every step). */
  steps?: string[];
  /** The card's tag in Wade's words ("Task", "Thread", "Task + Thread" for one matter merged from several sources) and
      whose matter it is ("AWT · 33 Fallingstar", "Personal · home"); both from Bench's fixed word lists (Bench 11-20). */
  label?: string; whose?: string;
}
/** "answer" (a TWM interview card, Bench 2026-11-20) sends the typed text as the answer, so it needs the box filled. */
export type NeedDo = "approve" | "deny" | "answer";
export interface NeedAction { do: NeedDo; label: string; effect: string }
/** One of Wade's recent choices, from either screen, and whether it applied. */
export interface Decision { title: string; label: string; by: string; at: string; ok: boolean; message: string }
/** What the nightly loop did with his notes (Bench loop wave L3): Closed, Moved, Recorded, Passed on, Asked you. Read-only. */
export interface Handled { what: string; title: string; at: string; undone: boolean; id: string }
export interface Needs { available: boolean; generated?: string; count?: number; private?: number; private_shown?: number; more?: number; unreadable?: number; items?: NeedCard[]; /** TWM's weekly-interview cards, shown on the TWM tab (Bench 2026-11-21: one TWM card in Today). */ twm_items?: NeedCard[]; by_tab?: Record<string, number>; upkeep?: UpkeepGroup[]; decided?: Decision[]; handled?: Handled[];
  /** Cards that stay on the desktop only (NCPT patient data; Bench 2026-11-19 evening): a count, never a card. */
  desk_only?: number }
/** System upkeep (Bench REVIEW-nav proposal 2): per kind a count and the one shared reply. */
export interface UpkeepGroup { kind: string; count: number; reply: string }
/** His items first; the system's own upkeep collapsed below, each kind's reply said once; then threads that finished
    and ask nothing (Bench 2026-11-19 evening: "Finishing isn't the same as needing Wade"), to check off once seen. */
export function splitNeeds(n: Needs): { life: NeedCard[]; upkeep: NeedCard[]; groups: UpkeepGroup[]; finished: NeedCard[] } {
  const items = n.items ?? [];
  return { life: items.filter((c) => c.group !== "upkeep" && c.group !== "finished"), upkeep: items.filter((c) => c.group === "upkeep"),
    groups: n.upkeep ?? [], finished: items.filter((c) => c.group === "finished") };
}
/** Tab-bar badge from the one Needs list (Bench REVIEW-nav proposal 1): Today counts every card, other tabs the cards
 * acted on there. An older snapshot without by_tab keeps the old Threads badge. */
export function tabBadge(s: Pick<Snapshot, "threads" | "needs"> | null, tab: string): number {
  if (!s) return 0;
  const by = s.needs?.available ? s.needs.by_tab : undefined;
  if (by) return by[tab] ?? 0;
  return tab === "threads" ? s.threads?.needs_you ?? 0 : 0;
}
export const NEED_LABEL: Record<string, string> = {
  thread_waiting: "Thread", project_ask: "Project step", close_pending: "Done, not closed", twm_decision: "TWM decision", twm_desk: "TWM desk", twm_interview: "TWM interview", twm_summary: "TWM",
  housekeeping_ok: "Housekeeping OK", approved_stuck: "Approved, not applied", feedback_go: "Feedback: your call",
  feedback_ship: "Feedback: ship?", burn_plan: "Burn plan", deck: "Deck card", feedback_route: "Feedback route",
  held_approval: "Permission held", mail: "Email", job_failed: "Job not working", luna_finding: "Code review finding",
  thread_finished: "Finished", bench_item: "Task", repeat_ask: "Asked again", registry_held: "Held change", your_words: "Your note",
};
/** The chip on a card: Bench's own tag, else the kind's word, never a raw kind name (Wade 11-20 saw "bench_item"). */
export function needChip(c: Pick<NeedCard, "kind" | "label">): string {
  return c.label || NEED_LABEL[c.kind] || "Item";
}
/** The card's age from its since date (Bench E1: every card shows its age): "new today", "since yesterday",
    "waiting 10d"; "" for an unreadable date. */
export function waitingLabel(since: string, now = Date.now()): string {
  const t = Date.parse(since);
  if (!since || Number.isNaN(t)) return "";
  const d = Math.floor((now - t) / 86400000);
  return d > 1 ? `waiting ${d}d` : d === 1 ? "since yesterday" : "new today";
}
/** One line per recent choice: "Build it · Garden idea · applied" or "... · did not apply: reason". */
export function decisionLine(d: Decision): string {
  return `${d.label} · ${d.title} · ${d.ok ? "applied" : `did not apply: ${d.message}`}`;
}
/** One line per thing the loop did overnight: "Closed · Property Tax Installment 1", "· undone" when he reversed it. */
export function handledLine(h: Handled): string {
  return `${h.what} · ${h.title}${h.undone ? " · undone" : ""}`;
}
/** The one summary line under the heading: count, cards past the cap, unreadable sources. Every card is on the phone
    with its own text since 2026-11-19 evening; one with patient data stays at the desk and is only counted
    ("N items on desktop only"). An older snapshot's `private` count still reads "more on the desktop". */
export function needsSummary(n: Needs): string {
  const bits = [`${n.count ?? 0} waiting on you`];
  const more = (n.private ?? 0) + (n.more ?? 0);
  if (more) bits.push(`${more} more on the desktop`);
  if (n.desk_only) bits.push(`${n.desk_only} item${n.desk_only === 1 ? "" : "s"} on desktop only`);
  if (n.unreadable) bits.push(`${n.unreadable} source(s) unreadable, list may be short`);
  return bits.join(" · ");
}

/** Under Today's lists: what the phone leaves out (the rest past the cap, and private rows, never tagged). */
export function todayMore(t: { more?: number; hidden?: number }): string {
  const n = (t.more ?? 0) + (t.hidden ?? 0);
  return n ? `${n} more on the desktop` : "";
}

export interface Snapshot {
  schema: number; generated_at: string; stale_after_min: number; read_only: boolean;
  today: { counts: { overdue: number; upcoming: number; active: number }; top: Ev[]; outstanding: Ev[]; more?: number; hidden?: number; access?: string[] };
  deck: Card[]; week: Ev[]; twm: Twm; homeschool?: Homeschool; state?: StateView;
  threads: { as_of: string; error: string; needs_you: number; items: Thread[]; pass?: PassRow[]; housekeeping?: Housekeeping | null };
  needs?: Needs;
  your_feedback?: { available: boolean; items?: { app: string; text: string; state: string; sent: string }[]; hidden?: number };
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

/** How old the State screen's data may get before it is shown with a warning (Bench's rule: 2 hours). */
export const STATE_WARN_MIN = 120;

/** "as of HH:MM" (local time) for the State screen, and whether it is old enough to warn. Unreadable stamp: warn. */
export function stateAsOf(s: Pick<Snapshot, "generated_at"> & { state?: { generated_at?: string } }, now = Date.now()): { label: string; warn: boolean } {
  const t = Date.parse(s.state?.generated_at || s.generated_at);
  if (Number.isNaN(t)) return { label: "as of unknown time", warn: true };
  const d = new Date(t);
  const hh = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { label: `as of ${hh}`, warn: Math.max(0, Math.round((now - t) / 60000)) > STATE_WARN_MIN };
}

/** "3d overdue" / "in 12d" for a State row's next deadline. */
export const stateDue = (days: number | null): string => dueLabel(days);

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
