import { useMemo, useState } from "react";
import type { Board, BoardBlock } from "./lib/snapshot.ts";

type Seg = { kind: "sprint" | "month" | "quarter"; x: number; w: number; a: number; z: number; label: string; current: boolean; blocks: Record<string, BoardBlock | string | string[]> };
const W = { sprint: 150, month: 120, quarter: 140 };
const LH = 58, HEAD = 22;
const sdot = (s: string) => `sdot ${s === "on track" ? "ok" : s === "at risk" ? "warn" : s ? "bad" : "dim"}`;
const HEALTH: Record<string, string> = { ran: "Ran last night", failed: "Failed last night", skipped: "Skipped last night", planned: "Planned only last night", missed: "Didn't run last night", none: "No runs yet" };

/** Summary strip plus one horizontal plan: sprints, then months, then quarters. Scrolls sideways inside its own box. */
export default function TwmBoard({ b }: { b?: Board }) {
  const [pick, setPick] = useState<string | null>(null);
  const g = useMemo(() => {
    if (!b?.available) return null;
    const segs: Seg[] = []; let x = 0;
    const add = (kind: Seg["kind"], o: { start: string; end: string; blocks: Seg["blocks"] }, label: string, current = false) => {
      segs.push({ kind, x, w: W[kind], a: Date.parse(o.start), z: Date.parse(o.end) + 864e5, label, current, blocks: o.blocks }); x += W[kind];
    };
    b.sprints?.forEach((o) => add("sprint", o, `Sprint ${o.n}`, o.current));
    b.months?.forEach((o) => add("month", o, `to ${o.label.replace(/\(.*$/, "").trim()}`));
    b.quarters?.forEach((o) => add("quarter", o, o.title.split(":")[0]));
    const xOf = (iso: string) => {
      const t = Date.parse(iso);
      const s = segs.find((q) => t >= q.a && t < q.z) ?? (segs.length && t < segs[0].a ? segs[0] : segs[segs.length - 1]);
      return s.x + Math.max(0, Math.min(1, (t - s.a) / (s.z - s.a))) * s.w;
    };
    return { segs, total: x, xOf };
  }, [b]);
  if (!b?.available || !b.strip || !g || !g.segs.length) return null;
  const st = b.strip, lanes = b.lanes ?? [];
  const H = HEAD + lanes.length * LH + 30;
  const detail: Record<string, string[]> = {};
  const blocks = lanes.flatMap((lane, li) => g.segs.map((s, si) => {
    const v = s.blocks[lane]; if (!v) return null;
    const text = typeof v === "string" ? v : Array.isArray(v) ? v[0] : v.goal; if (!text) return null;
    const id = `${si}-${li}`;
    detail[id] = typeof v === "string" ? [`${s.label} · ${lane}`, v] : Array.isArray(v) ? [`${s.label} · ${lane}`, ...v]
      : [`${s.label} · ${lane}${v.status ? ` (${v.status})` : ""}`, v.goal, v.done ? `Done means: ${v.done}` : "", v.status_text];
    const status = typeof v === "object" && !Array.isArray(v) ? v.status : "";
    return <button key={id} className={`blk k-${s.kind}${s.current ? " cur" : ""}`} onClick={() => setPick(id)}
      style={{ left: s.x + 2, width: s.w - 4, top: HEAD + li * LH + 4, height: LH - 8 }}>
      {status && <span className={sdot(status)} />} {text}</button>;
  }));
  const miles = (b.milestones ?? []).map((m, i) => {
    const id = `m${i}`; detail[id] = [`${m.wade ? "✋ " : ""}${m.name}`, m.date + (m.status ? ` · ${m.status}` : "")];
    return <button key={id} className={`ms${m.wade ? " wade" : ""}`} aria-label={m.name} onClick={() => setPick(id)}
      style={{ left: g.xOf(m.date) - 11, top: H - 28 }} />;
  });
  const hl = st.health, ms = st.milestone, sp = st.sprint;
  return (
    <>
      <div className="board-strip">
        <div className="card"><div className="eyebrow">Your decisions</div><b className={st.decisions.total ? "warn" : "ok"}>{st.decisions.total}</b>
          <div className="meta">{st.decisions.queue} queued · {st.decisions.desk} on the desk</div></div>
        <div className="card"><div className="eyebrow">This sprint</div>{sp ? <><b>{sp.n}</b> <span className="meta">day {sp.day} of {sp.of}</span>
          <div className="meta">{sp.goals.map((q) => <span key={q.lane}><span className={sdot(q.status)} /> {q.lane.split(" ")[0]} </span>)}</div></> : <b>-</b>}</div>
        <div className="card"><div className="eyebrow">Next milestone</div>{ms ? <><b>{ms.days}</b> <span className="meta">days</span>
          <div className="meta">{ms.wade ? "✋ " : ""}{ms.name}</div></> : <b>-</b>}</div>
        <div className="card"><div className="eyebrow">Health</div>
          <b className={hl.last === "ran" ? "ok" : hl.last === "failed" || hl.last === "missed" ? "bad" : "warn"}>{HEALTH[hl.last] ?? hl.last}</b>
          <div className="meta">{hl.of ? `${hl.nights} of ${hl.of} nights this sprint` : "sprint starts soon"}{hl.ended ? ` · ${hl.ended}` : ""}</div>
          <div className="nights">{hl.days.map((d) => <span key={d.date} className={`night n-${d.state}`} title={`${d.date} ${d.state}`} />)}</div></div>
      </div>
      <h2>Plan on one line</h2>
      <div className="meta">Sprints, then months, then quarters. Swipe sideways; tap a block. ◆ milestone, ✋ only you.</div>
      <div className="gscroll"><div className="gantt" style={{ width: g.total, height: H }}>
        {g.segs.map((s, i) => <div key={i} className="sh" style={{ left: s.x, width: s.w }}>{s.label}</div>)}
        {lanes.map((l, li) => <div key={l} className="lane" style={{ top: HEAD + li * LH, height: LH }}><span>{l}</span></div>)}
        {blocks}{miles}
        <div className="today" style={{ left: g.xOf(b.today ?? "") }} />
      </div></div>
      {pick && detail[pick] && <div className="card pop" onClick={() => setPick(null)}>
        {detail[pick].filter(Boolean).map((t, i) => i === 0 ? <div className="t" key={i}>{t}</div> : <div key={i} className={i > 1 ? "meta" : ""}>{t}</div>)}</div>}
    </>
  );
}
