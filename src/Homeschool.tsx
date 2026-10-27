import { useState } from "react";
import { agoLabel } from "./lib/snapshot.ts";
import type { Homeschool, HsSubject } from "./lib/snapshot.ts";
import { PACE_TEXT, bar, hours, pace, syncState } from "./lib/homeschool.ts";

const SHORT: Record<string, string> = { "Language Arts": "Lang. Arts", "Social Studies": "Soc. Studies", "Physical Education": "P.E.", "Social-Emotional": "Soc-Emo" };
const short = (s: string) => SHORT[s] ?? s;
const md = (iso: string) => (iso ? `${+iso.slice(5, 7)}/${+iso.slice(8, 10)}` : "");

function Subject({ r }: { r: HsSubject }) {
  const b = bar(r), p = pace(r);
  return (
    <div className="hs-row">
      <div className="hs-top"><span>{short(r.subject)}</span><span className={`hs-pace ${p}`}>{PACE_TEXT[p]}</span></div>
      <div className="hs-track" role="img" aria-label={`${short(r.subject)}: ${r.logged} of ${r.target} minutes logged`}>
        <i className="hs-done" style={{ width: `${b.logged}%` }} />
        <i className="hs-plan" style={{ left: `${b.logged}%`, width: `${b.planned}%` }} />
        <i className="hs-tick" style={{ left: `${b.tick}%` }} />
      </div>
      <div className="meta">{hours(r.logged)} of {hours(r.target)}{r.scheduled ? ` · ${hours(r.scheduled)} scheduled` : ""}</div>
    </div>
  );
}

/** The desktop Homeschool tab, phone-sized and counts-only: no names, titles or file names ever reach this view. */
export default function HomeschoolView({ h }: { h?: Homeschool }) {
  const [wk, setWk] = useState(false);
  if (!h) return <div className="empty">School arrives with the next Bench update (within 15 minutes).</div>;
  if (!h.available) return <div className="empty">Homeschool data isn't available right now.</div>;
  const lp = h.lp, ws = h.work_samples, d = h.drive, w = h.week;
  const ss = syncState(h.sync);
  const dayPct = lp && lp.total_days ? Math.round((100 * lp.elapsed_days) / lp.total_days) : 0;
  return (
    <>
      <div className="card">
        <div className="t">{lp?.label ?? "No learning period today"}</div>
        {lp && <>
          <div className="meta">{md(lp.start)} – {md(lp.end)} · day {lp.elapsed_days} of {lp.total_days}</div>
          <div className="hs-track"><i className="hs-done" style={{ width: `${dayPct}%` }} /></div>
        </>}
        <div className="grid3">
          <div><b>{ws ? `${ws.have} / ${ws.required}` : "?"}</b><span>work samples</span></div>
          <div><b>{w?.pending ?? 0}</b><span>to confirm</span></div>
          <div><b>{w?.pct ?? 0}%</b><span>this week</span></div>
        </div>
        <div className="meta"><span className={`sync ${ss.kind}`}><i className="dot" />{ss.kind === "none" ? "Asana sync hasn't reported yet" : `Asana synced ${agoLabel(ss.min)}`}</span>
          {h.sync && h.sync.added > 0 ? ` · ${h.sync.added} new` : ""}{h.sync?.skipped ? ` · skipped: ${h.sync.skipped}` : ""}</div>
      </div>

      <h2>Learning period progress</h2>
      <div className="card">
        {h.lp_subjects?.length ? h.lp_subjects.map((r) => <Subject key={r.subject} r={r} />) : <div className="meta">No minutes logged yet.</div>}
        <div className="tl-key"><span className="hs-key done" />logged <span className="hs-key plan" />scheduled <span className="hs-key tick" />steady pace by today</div>
      </div>

      <h2>Work samples &amp; Drive</h2>
      <div className="card">
        {ws && <div className="t">{ws.have} of {ws.required} required samples attached</div>}
        {ws?.by_subject.length ? <div className="meta">{ws.by_subject.map((x) => `${short(x.subject)} ${x.n}`).join(" · ")}</div> : null}
        {d ? <>
          <div className="grid3">
            <div><b>{d.files}</b><span>files in Drive</span></div>
            <div><b>{d.linked}</b><span>linked</span></div>
            <div><b className={d.unmatched ? "bad" : ""}>{d.unmatched}</b><span>unmatched</span></div>
          </div>
          {d.by_subject.map((x) => <div className="meta" key={x.subject}>{short(x.subject)}: {x.files} file{x.files === 1 ? "" : "s"}, {x.unmatched} unmatched</div>)}
          {d.undated ? <div className="meta">{d.undated} file{d.undated === 1 ? "" : "s"} with no date in the name</div> : null}
          <div className="meta">Drive listing {d.listing_age_min == null ? "age unknown" : agoLabel(d.listing_age_min)}. Unmatched files are waiting for a worksheet entry on the same day and subject.</div>
        </> : <div className="meta">Drive mapping isn't available.</div>}
      </div>

      {w && <>
        <h2>This week · {md(w.start)} – {md(w.end)}</h2>
        <div className="hs-days">
          {w.days.map((x) => (
            <div key={x.date} className={`hs-day${x.pending ? " pend" : ""}`}>
              <b>{x.weekday}</b><span>{x.total ? `${x.confirmed}/${x.total}` : "–"}</span>{x.work_sample ? <i className="dot ws" title="work sample" /> : <i />}
            </div>))}
        </div>
        <div className="meta">Confirmed / planned per day. Amber means something needs confirming on the desktop.</div>
        <button className="link" onClick={() => setWk(!wk)} aria-expanded={wk}>{wk ? "Hide" : "Show"} weekly minutes by subject</button>
        {wk && <div className="card">{w.subjects.map((r) => <Subject key={r.subject} r={r} />)}</div>}
      </>}
    </>
  );
}
