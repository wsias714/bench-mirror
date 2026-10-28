import type { Delivery, DeliveryRow, TlBullet, Timeline12, Twm } from "./lib/snapshot.ts";

const when = (ts: string) => {
  const d = new Date(ts.includes("Z") || /[+-]\d\d:\d\d$/.test(ts) ? ts : `${ts}Z`.replace("ZZ", "Z"));
  return Number.isNaN(d.getTime()) ? ts.slice(0, 16) : ts.slice(5, 10).replace("-", "/") + " " + ts.slice(11, 16);
};
const List = ({ items }: { items?: string[] }) => (items?.length ? <ul className="twm-list">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : null);

const STATUS_CLASS: Record<string, string> = { done: "ok", "on track": "ok", "at risk": "warn", late: "bad", blocked: "bad", "not started": "dim" };
const Pill = ({ r }: { r: DeliveryRow }) => (r.status
  ? <><span className={`chip ${STATUS_CLASS[r.status] ?? "dim"}`}>{r.status}</span>{r.status_text.toLowerCase() !== r.status ? <span className="meta"> {r.status_text}</span> : null}</>
  : r.status_text ? <span className="meta">{r.status_text}</span> : null);

const Rows = ({ rows, cols }: { rows?: DeliveryRow[]; cols: string[] }) => (
  <>{rows?.map((r, i) => (
    <div className="card" key={i}>
      <div className="t">{r.c0}</div>
      <div>{r.c1}</div>
      {cols[2] && r.c2 && <div className="meta">{cols[2]}: {r.c2}</div>}
      {cols[3] && r.c3 && <div className="meta">{cols[3]}: {r.c3}</div>}
      <div><Pill r={r} /></div>
    </div>))}</>
);

/** ops/DELIVERY.md from the COO: the next 14 days, milestones, roadblocks and Wade's asks. */
function DeliveryView({ d }: { d?: Delivery }) {
  if (!d?.available) return null;
  return (
    <>
      <h2>Delivery plan</h2>
      {d.updated && <div className="meta">{d.updated}</div>}
      {d.summary && <p>{d.summary}</p>}
      <div className="eyebrow">Next 14 days</div>
      <Rows rows={d.next14} cols={["When", "Deliverable", "Owner", "You see it in"]} />
      <details className="more"><summary>Milestones ({d.milestones?.length ?? 0})</summary>
        <Rows rows={d.milestones} cols={["Date", "Milestone", "Done means"]} /></details>
      <details className="more"><summary>Roadblocks ({d.roadblocks?.length ?? 0})</summary>
        {d.roadblocks?.map((r) => (
          <div className="card" key={r.n}>
            <div className="t">{r.n}. {r.title}</div>
            {r.lines.map((l, i) => <div className="meta" key={i} style={{ marginLeft: l.depth * 10 }}>{l.text}</div>)}
          </div>))}</details>
      <details className="more"><summary>Your asks ({d.asks?.length ?? 0})</summary>
        <Rows rows={d.asks} cols={["Ask", "Asked", "Answered by", "Target"]} /></details>
    </>
  );
}

const Bullets = ({ items }: { items?: TlBullet[] }) => (
  <>{items?.map((l, i) => <div className="meta" key={i} style={{ marginLeft: l.depth * 10 }}>{l.depth === 0 ? "• " : "– "}{l.text}</div>)}</>
);

/** ops/TIMELINE.md from the COO: the current sprint first, then the later sprints, months 2-3, the quarters and the critical path. */
function TimelineView({ t }: { t?: Timeline12 }) {
  if (!t?.available) return null;
  const sprints = t.sprints ?? [];
  const sprint = (sp: (typeof sprints)[number]) => (
    <>{sp.rows.map((r, i) => (
      <div className="card" key={i}>
        <div className="t">{r.c0}</div>
        <div>{r.c1}</div>
        {r.c2 && <div className="meta">Done means: {r.c2}</div>}
        <div><Pill r={r} /></div>
      </div>))}
      {sp.notes.map((n, i) => <div className="meta" key={i}>{n}</div>)}</>
  );
  const cur = sprints[t.current ?? 0];
  return (
    <>
      <h2>12-month timeline</h2>
      <div className="meta"><span className={`chip ${t.status === "PROPOSED" ? "warn" : "ok"}`}>{t.status || "status unknown"}</span> {t.status_note}</div>
      {t.goal?.map((g, i) => <p key={i}>{g}</p>)}
      {cur && <><div className="eyebrow">Current sprint · {cur.title}</div>{sprint(cur)}</>}
      {sprints.filter((_, i) => i !== (t.current ?? 0)).map((sp) => <details className="more" key={sp.title}><summary>{sp.title}</summary>{sprint(sp)}</details>)}
      <details className="more"><summary>Months 2–3</summary>
        {t.months23?.map((r, i) => (
          <div className="card" key={i}>
            <div className="t">{r.c0}</div>
            <div className="meta">Software: {r.c1}</div><div className="meta">Business: {r.c2}</div><div className="meta">Client acquisition: {r.c3}</div>
          </div>))}</details>
      <details className="more"><summary>Months 4–12 ({t.quarters?.length ?? 0} quarters)</summary>
        {t.quarters?.map((q) => <div className="card" key={q.title}><div className="t">{q.title}</div><Bullets items={q.items} /></div>)}</details>
      <details className="more"><summary>Critical path</summary><div className="card"><Bullets items={t.critical} /></div></details>
      <div className="meta">✋ marks a step only you can take.</div>
    </>
  );
}

/** The desktop TWM tab, phone-sized: what ran overnight, what moved, what is waiting, the plan, and build health. */
export default function TwmView({ t }: { t: Twm }) {
  if (!t.available) return <div className="empty">TWM data isn't available.</div>;
  const lr = t.last_run, f = t.failures, h = t.health, d = t.digest;
  return (
    <>
      <div className="card">
        <div className="t">Weekly report: {t.weekly_verdict || "none in the latest digest"}</div>
        <div className="grid3">
          <div><b>{t.running ? "Running" : t.paused ? "Paused" : "Idle"}</b><span>state</span></div>
          <div><b>{t.next_run ? t.next_run.replace(/^\w+ \d{4}-/, "").replace(/ P[DS]T/, "").replace(/:00$/, "") : "?"}</b><span>next run</span></div>
          <div><b>{f?.consecutive ?? "?"} / {f?.stop_after ?? "?"}</b><span>failures / stop</span></div>
        </div>
        {lr && <div className="meta">Last run {when(lr.ts)}: <span className={lr.ok ? "ok" : "bad"}>{lr.ok ? "ok" : "failed"}</span>{lr.moved != null ? `, ${lr.moved} moved` : ""}{lr.ended ? ` · ${lr.ended}` : ""}</div>}
        {t.paused && <div className="meta bad">Kill switch is on.</div>}
      </div>

      <DeliveryView d={t.delivery} />
      <TimelineView t={t.timeline} />

      <h2>What it did {d?.title ? `· ${d.title.replace(/^TWM digest\s*/i, "")}` : ""}</h2>
      {d?.notices?.map((n, i) => <p key={i} className="bad"><b>{n}</b></p>)}
      <div className="card">
        {d?.by_role && Object.keys(d.by_role).length
          ? Object.entries(d.by_role).map(([role, rows]) => <div key={role}>{role !== "OTHER" && <div className="eyebrow">{role}</div>}<List items={rows} /></div>)
          : <List items={d?.moved} />}
        {!d?.moved?.length && !Object.keys(d?.by_role ?? {}).length && <div className="meta">Nothing moved.</div>}
        {d?.next?.length ? <><div className="eyebrow">Next</div><List items={d.next} /></> : null}
        {d?.health && <div className="meta"><b>Health:</b> {d.health}</div>}
      </div>

      <h2>Decisions waiting on you</h2>
      {t.decisions_waiting?.map((q) => <div className="card" key={q.id}><div className="t">{q.id} · due {q.due}</div><div className="meta">{q.q}</div></div>)}
      {t.decisions_council?.map((q, i) => <div className="card" key={i}><div className="meta">{q}</div></div>)}
      {!t.decisions_waiting?.length && !t.decisions_council?.length && <div className="empty">Nothing waiting on you.</div>}
      {t.decisions_recent?.length ? <details className="more"><summary>Recently settled ({t.decisions_recent.length})</summary>
        {t.decisions_recent.map((q) => <div className="meta" key={q.id}><b>{q.id}</b> {q.status}: {q.q}</div>)}</details> : null}

      {t.plan && <>
        <h2>The plan {t.plan.updated ? `· ${t.plan.updated}` : ""}</h2>
        <div className="card">
          {t.plan.goal && <div>{t.plan.goal}</div>}
          <div className="eyebrow">Where things stand</div>
          <List items={t.plan.standing} />
        </div></>}

      {t.history?.length ? <>
        <h2>Overnight runs</h2>
        {t.history.map((r) => (
          <div className="card" key={r.ts}>
            <div className="t">{when(r.ts)} <span className={r.ok ? "ok" : "bad"}>{r.ok ? "ok" : "failed"}</span></div>
            <div className="meta">{r.plan_only ? "plan only" : "full cycle"} · {r.moved ?? "?"} moved{r.mins != null ? ` · ${r.mins} min` : ""}{r.calls != null ? ` · ${r.calls} calls` : ""}{r.cost != null ? ` · $${r.cost.toFixed(2)} compute` : ""}</div>
            {r.ended && <div className="meta">{r.ended}</div>}
          </div>))}</> : null}

      {h && Object.keys(h).length ? <>
        <h2>Build health</h2>
        <div className="card">
          <div className="t"><span className={h.green ? "ok" : "bad"}>{h.green ? "Gate green" : `Gate red${h.first_failure ? ` (${h.first_failure})` : ""}`}</span> · {h.tier} · {h.head}</div>
          <div className="meta">Phase {h.phase.current ?? "?"} of {h.phase.total ?? "?"}{h.phase.title ? ` — ${h.phase.title}` : ""}</div>
          <div className="meta">{h.probes_total != null ? `${h.probes_total - h.probes_red}/${h.probes_total} probes green` : ""}{h.pivots ? ` · ${h.pivots} open pivot` : ""} · gate run {h.at.replace("T", " ")}</div>
          {h.checks.length > 0 && <div className="checks">{h.checks.map((c) => <span key={c.id} className={`chip ${c.status === "pass" ? "ok" : c.status === "skip" ? "" : "bad"}`}>{c.id}</span>)}</div>}
          {h.unmerged.length > 0 && <><div className="eyebrow">Branches awaiting review</div>{h.unmerged.map((b, i) => <div className="meta" key={i}>◆ {b.headline} · {b.date}</div>)}</>}
        </div></> : null}
    </>
  );
}
