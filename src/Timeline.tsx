import { useMemo, useState } from "react";
import { dueLabel } from "./lib/snapshot.ts";
import type { Timeline as Tl, TlItem } from "./lib/snapshot.ts";
import { anchorOf, cellKey, columns, counts, domainsOf, groupByWeek, select } from "./lib/timeline.ts";
import type { Cell } from "./lib/timeline.ts";

const LABEL: Record<string, string> = { ncpt: "NCPT", awt: "AWT", nanny: "Nanny", personal: "Personal", house: "House", homeschool: "Homeschool", admin: "Admin" };
const label = (d: string) => LABEL[d] ?? (d || "Other");
const SHORT: Record<string, string> = { homeschool: "School", personal: "Pers." };
const short = (d: string) => SHORT[d] ?? label(d);

/** Domain x fortnight grid (tap a cell to list it), then a dated list. The desktop Gantt, for a thumb. */
export default function Timeline({ tl }: { tl: Tl }) {
  const [cell, setCell] = useState<Cell | null>(null);
  const all: TlItem[] = useMemo(() => [...tl.ahead, ...tl.overdue], [tl]);
  const anchor = useMemo(() => anchorOf(tl.ahead), [tl]);
  const cols = useMemo(() => columns(anchor, tl.days), [anchor, tl.days]);
  const domains = useMemo(() => domainsOf(all), [all]);
  const n = useMemo(() => counts(tl.ahead, tl.overdue), [tl]);
  const shown = useMemo(() => select(tl.ahead, tl.overdue, cell), [tl, cell]);
  const groups = useMemo(() => groupByWeek(shown, anchor), [shown, anchor]);
  const max = Math.max(1, ...n.values());
  const picked = cell ? cellKey(cell) : "";

  if (!all.length) return <div className="empty">Nothing on the timeline.</div>;
  return (
    <>
      <div className="tl-grid" style={{ gridTemplateColumns: `52px repeat(${cols.length + 1}, 1fr)` }} role="grid" aria-label="Deadlines by domain and fortnight">
        <div />
        <div className="tl-h bad">Late</div>
        {cols.map((c) => <div key={c.index} className="tl-h">{c.label}</div>)}
        {domains.map((d) => (
          <Row key={d} d={d} cols={cols.length} n={n} max={max} picked={picked} onPick={setCell} />
        ))}
      </div>
      <div className="tl-key">
        <span className="tl-sw late" /> overdue · darker = more due · tap a cell <button className="link" onClick={() => setCell(null)}>{cell ? "Show next 14 days" : "Showing next 14 days"}</button>
      </div>
      <h2>{cell ? `${label(cell.domain)} · ${cell.col === -1 ? "overdue" : "from " + cols[cell.col]?.label}` : "Next two weeks"}</h2>
      {groups.length ? groups.map((g) => (
        <section key={g.label}>
          <div className="tl-week">{g.label}</div>
          {g.items.map((i) => (
            <div key={i.id} className="card tl-item" data-domain={i.domain || "other"}>
              <div className="t">{i.title}</div>
              <div className="meta"><span className="chip">{label(i.domain)}</span>{i.days !== null && i.days < 0 ? <span className="bad">{dueLabel(i.days)}</span> : dueLabel(i.days)} · {i.due}</div>
            </div>
          ))}
        </section>
      )) : <div className="empty">Nothing in this cell.</div>}
      {tl.overdue_total > tl.overdue.length && <p className="note">{tl.overdue_total - tl.overdue.length} more overdue not shown.</p>}
    </>
  );
}

function Row({ d, cols, n, max, picked, onPick }: { d: string; cols: number; n: Map<string, number>; max: number; picked: string; onPick: (c: Cell) => void }) {
  const cells = [-1, ...Array.from({ length: cols }, (_, i) => i)];
  return (
    <>
      <div className="tl-dom" data-domain={d}>{short(d)}</div>
      {cells.map((col) => {
        const k = `${d || "other"}|${col}`;
        const c = n.get(k) ?? 0;
        return (
          <button key={k} role="gridcell" disabled={!c} aria-pressed={picked === k} aria-label={`${label(d)} ${c} item${c === 1 ? "" : "s"}`}
            className={`tl-cell${col === -1 ? " late" : ""}${picked === k ? " on" : ""}`} data-domain={d}
            style={{ opacity: c ? 0.35 + 0.65 * (c / max) : 1 }} onClick={() => onPick({ domain: d, col })}>
            {c || ""}
          </button>
        );
      })}
    </>
  );
}
