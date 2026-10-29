import { useState } from "react";
import { agoLabel } from "./lib/snapshot.ts";
import type { Homeschool, HsRecord, HsSubject, LpReport } from "./lib/snapshot.ts";
import SubmitLpCard from "./SubmitLp.tsx";
import type { Sender } from "./Answer.tsx";
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

const FILTERS = [["all", "All"], ["pending", "To confirm"], ["confirmed", "Confirmed"], ["upcoming", "Upcoming"]] as const;
type Filter = (typeof FILTERS)[number][0];
const inFilter = (r: HsRecord, f: Filter) => f === "all" || (f === "upcoming" ? r.future : f === "pending" ? r.status === "pending" && !r.future : r.status === f);

function Record({ r }: { r: HsRecord }) {
  const [open, setOpen] = useState(false);
  const kind = r.future ? "upcoming" : r.status;
  return (
    <div className="hs-rec">
      <button className="hs-rec-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="hs-rec-date">{md(r.date)}</span>
        <span className="hs-rec-type">{r.type || "Entry"}</span>
        <span className="hs-rec-min">{r.minutes} min</span>
        <span className={`hs-badge ${kind}`}>{kind}</span>
      </button>
      {open && <div className="hs-rec-body">
        {r.text && <div>{r.text}</div>}
        <div className="meta">{r.subjects.map(short).join(" · ") || "No subject"}{r.program ? ` · ${r.program}` : ""}</div>
        <div className="meta">{r.date}{r.work_sample ? " · work sample" : ""}{r.has_file ? " · file attached" : ""}</div>
      </div>}
    </div>
  );
}

const pct = (a: number, b: number) => (b ? Math.min(100, Math.round((100 * a) / b)) : 0);

/** The school-facing LP report, phone-sized: what Suncoast gets, per student, with names masked by Bench. */
function LpReportView({ r }: { r: LpReport }) {
  const [i, setI] = useState(0);
  const [log, setLog] = useState(false);
  const st = r.students[Math.min(i, r.students.length - 1)];
  if (!st) return null;
  return (
    <>
      <h2>{r.lp.label} report</h2>
      <div className="meta">{md(r.lp.start)} – {md(r.lp.end)} ({r.lp.total_days} days) · recorded through {md(r.through)}</div>
      {r.students.length > 1 && <div className="hs-filters" role="group" aria-label="Student">
        {r.students.map((x, k) => <button key={x.label} className={k === i ? "on" : ""} aria-pressed={k === i} onClick={() => setI(k)}>{x.label}</button>)}
      </div>}
      <div className="card">
        <div className="grid3">
          <div><b>{st.activities}</b><span>activities</span></div>
          <div><b>{hours(st.minutes)}</b><span>of learning</span></div>
          <div><b>{st.days}</b><span>days active</span></div>
        </div>
        <div className="meta">Work samples on file: {st.samples_on_file} of {st.samples_required} required</div>
      </div>
      <div className="card">
        <div className="t">Minutes by subject</div>
        {st.subjects.map((x) => (
          <div className="hs-row" key={x.subject}>
            <div className="hs-top"><span>{short(x.subject)}{x.required ? " ·  required" : ""}</span><span>{x.minutes} / {x.target} min</span></div>
            <div className="hs-track" role="img" aria-label={`${short(x.subject)}: ${x.minutes} of ${x.target} minutes`}><i className="hs-done" style={{ width: `${pct(x.minutes, x.target)}%` }} /></div>
          </div>))}
      </div>
      {st.classes.length > 0 && <div className="card">
        <div className="t">Enrolled classes</div>
        {st.classes.map((c) => <div className="meta" key={c.name}>{c.name}{c.schedule ? ` · ${c.schedule}` : ""} · {c.sessions} session{c.sessions === 1 ? "" : "s"} · {c.minutes} min</div>)}
      </div>}
      {st.samples.length > 0 && <div className="card">
        <div className="t">Work samples on file</div>
        {st.samples.map((x, k) => <div className="meta" key={k}>{md(x.date)} · {x.subjects.map(short).join(", ")}{x.activity ? ` · ${x.activity}` : ""}</div>)}
      </div>}
      <button className="link" onClick={() => setLog(!log)} aria-expanded={log}>{log ? "Hide" : "Show"} activity log ({st.log.length})</button>
      {log && <div className="card">
        {st.log.map((x, k) => <div className="hs-rec-head" style={{ gridTemplateColumns: "44px 1fr auto" }} key={k}><span className="hs-rec-date">{md(x.date)}</span><span>{x.activity}<span className="meta"> {x.subjects.map(short).join(", ")}</span></span><span className="hs-rec-min">{x.minutes ? `${x.minutes} min` : "–"}</span></div>)}
      </div>}
    </>
  );
}

/** The desktop Homeschool tab, phone-sized and no child names or file names reach this view; entry text is masked by Bench before it is published. */
export default function HomeschoolView({ h, send, can }: { h?: Homeschool; send: Sender; can: boolean }) {
  const [wk, setWk] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
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

      {h.submit && <SubmitLpCard s={h.submit} send={send} can={can} />}

      {h.lp_report && h.lp_report.students.length > 0 && <LpReportView r={h.lp_report} />}

      {h.records && <>
        <h2>All entries this period · {h.records.total}</h2>
        <div className="hs-filters" role="group" aria-label="Filter entries">
          {FILTERS.map(([k, label]) => <button key={k} className={filter === k ? "on" : ""} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>)}
        </div>
        <div className="card">
          {(() => {
            const rows = h.records!.rows.filter((r) => inFilter(r, filter));
            return rows.length ? rows.map((r, i) => <Record key={`${r.date}-${i}`} r={r} />) : <div className="meta">Nothing in this view.</div>;
          })()}
          {h.records.total > h.records.rows.length ? <div className="meta">Showing the newest {h.records.rows.length} of {h.records.total}.</div> : null}
        </div>
      </>}

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
