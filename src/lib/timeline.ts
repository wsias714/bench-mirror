/* Phone timeline: the desktop Gantt, reshaped for a narrow screen. A grid of domain rows by
   fortnight columns (each cell tappable, 44px tall), an overdue column on the left, and a
   dated list underneath. Pure functions so they run under `node --test`. */
import type { TlItem } from "./snapshot.ts";

export const COL_DAYS = 15;                    // 90 days = six columns of about a fortnight
export const DOMAIN_ORDER = ["ncpt", "awt", "nanny", "personal", "house", "homeschool", "admin"];
const DAY = 86400000;

export interface Col { index: number; from: number; to: number; label: string }
export interface Cell { domain: string; col: number }              // col -1 is the overdue column

/** The domains that have anything to show, in the desktop's order, unknown ones last. */
export function domainsOf(items: TlItem[]): string[] {
  const seen = new Set(items.map((i) => i.domain || "other"));
  return [...DOMAIN_ORDER.filter((d) => seen.has(d)), ...[...seen].filter((d) => !DOMAIN_ORDER.includes(d)).sort()];
}

/** The day the snapshot's `days` counts from, read off any item (due minus days). */
export function anchorOf(items: TlItem[]): Date | null {
  const it = items.find((i) => i.days !== null && i.due);
  if (!it) return null;
  const t = Date.parse(`${it.due}T00:00:00Z`);
  return Number.isNaN(t) ? null : new Date(t - (it.days as number) * DAY);
}

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function columns(anchor: Date | null, span = 90): Col[] {
  const out: Col[] = [];
  for (let from = 0, i = 0; from < span; from += COL_DAYS, i++) {
    out.push({ index: i, from, to: Math.min(span, from + COL_DAYS) - 1, label: anchor ? fmt(new Date(anchor.getTime() + from * DAY)) : `+${from}d` });
  }
  return out;
}

export const colOf = (days: number | null): number => (days === null || days < 0 ? -1 : Math.floor(days / COL_DAYS));

/** Count of items per domain per column (-1 = overdue). */
export function counts(ahead: TlItem[], overdue: TlItem[]): Map<string, number> {
  const m = new Map<string, number>();
  const bump = (d: string, c: number) => m.set(`${d || "other"}|${c}`, (m.get(`${d || "other"}|${c}`) ?? 0) + 1);
  ahead.forEach((i) => bump(i.domain, colOf(i.days)));
  overdue.forEach((i) => bump(i.domain, -1));
  return m;
}

export const cellKey = (c: Cell) => `${c.domain}|${c.col}`;

/** Items to list: one tapped cell, or (with no selection) everything in the next 14 days. */
export function select(ahead: TlItem[], overdue: TlItem[], cell: Cell | null): TlItem[] {
  if (cell) {
    const pool = cell.col === -1 ? overdue : ahead.filter((i) => colOf(i.days) === cell.col);
    return pool.filter((i) => (i.domain || "other") === cell.domain);
  }
  return ahead.filter((i) => i.days !== null && i.days <= 13);
}

/** Group a list by calendar week (7-day blocks from the anchor), labelled "This week", "Next week", then dates. */
export function groupByWeek(items: TlItem[], anchor: Date | null): { label: string; items: TlItem[] }[] {
  const groups = new Map<number, TlItem[]>();
  for (const i of items) {
    const w = i.days === null || i.days < 0 ? -1 : Math.floor(i.days / 7);
    groups.set(w, [...(groups.get(w) ?? []), i]);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([w, its]) => ({
    label: w < 0 ? "Overdue" : w === 0 ? "This week" : w === 1 ? "Next week" : anchor ? `Week of ${fmt(new Date(anchor.getTime() + w * 7 * DAY))}` : `+${w * 7}d`,
    items: its.sort((a, b) => (a.due || "").localeCompare(b.due || "") || a.title.localeCompare(b.title)),
  }));
}
