import type { Twm } from "./lib/snapshot.ts";

const when = (ts: string) => {
  const d = new Date(ts.includes("Z") || /[+-]\d\d:\d\d$/.test(ts) ? ts : `${ts}Z`.replace("ZZ", "Z"));
  return Number.isNaN(d.getTime()) ? ts.slice(0, 16) : ts.slice(5, 10).replace("-", "/") + " " + ts.slice(11, 16);
};
const List = ({ items }: { items?: string[] }) => (items?.length ? <ul className="twm-list">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : null);

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
