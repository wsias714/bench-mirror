import { useState } from "react";
import { lpPick, lpSubmit, sentKey } from "./lib/inbox.ts";
import type { Payload } from "./lib/inbox.ts";
import type { LpSubmit } from "./lib/snapshot.ts";
import { useSent } from "./Answer.tsx";
import type { Sender } from "./Answer.tsx";

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

const lastText = (l: NonNullable<LpSubmit["last"]>) =>
  `${l.outcome === "placed" ? `placed ${l.placed} files` : l.outcome === "failed" ? "copy failed part-way; nothing was removed, submit again to finish" : l.outcome === "refused" ? `refused (${l.reason.join(", ") || "checklist"})` : l.outcome === "stale-plan" ? "the list changed, review and submit again" : l.outcome} · ${l.at.slice(5, 10)} ${l.at.slice(11, 16)} UTC`;

/** Pick the work samples, see the checklist, then confirm. Bench runs the same checks again before it places
    anything in the school's folder, so a stale phone screen cannot submit something that no longer passes. */
export default function SubmitLpCard({ s, send, can }: { s: LpSubmit; send: Sender; can: boolean }) {
  const { waiting, mark } = useSent();
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submitKey = sentKey("s", `${s.lp}:${s.plan_hash}`);
  const go = async (p: Payload, key: string) => {
    setBusy(true); setErr("");
    const m = await send(p);
    setBusy(false);
    if (m) setErr(m); else mark(key);
  };
  const sent = waiting(submitKey);
  const failing = s.checks.filter((c) => !c.ok);
  return (
    <>
      <h2>Submit {s.lp} to the school</h2>
      {s.last && <div className="meta">Last attempt: {lastText(s.last)}</div>}
      <div className="card">
        {s.candidates.length ? s.candidates.map((c) => {
          const k = sentKey("p", `${s.lp}:${c.key}`);
          const pending = waiting(k);
          return (
            <button key={c.key} className="wide" disabled={busy || !can || !(c.pickable || c.picked) || pending || sent}
              aria-pressed={c.picked} onClick={() => void go(lpPick(s.lp, c.key, !c.picked), k)}>
              {c.picked ? "✓ " : ""}{c.subject} · {md(c.date)}{c.reason ? ` (can't submit: ${c.reason})` : ""}{c.flag ? " ⚠ 2 files, both go" : ""}{pending ? " · sent" : ""}
            </button>);
        }) : <div className="meta">No work samples on file for this period yet.</div>}
        <div className="meta">Tap to pick or unpick. Changes show here after Bench's next update (within 15 minutes).</div>
      </div>
      <div className="card">
        {s.checks.map((c) => <div key={c.label} className="meta"><span className={`chip ${c.ok ? "ok" : "bad"}`}>{c.ok ? "ok" : "fix"}</span> {c.label}</div>)}
        {sent ? <div className="ok">Sent. Bench picks it up within 15 minutes and places the files; this screen updates after that.</div>
          : !can ? <div className="meta">Connect Dropbox in Settings to submit.</div>
          : !review ? <button className={`wide${s.ready ? " primary" : ""}`} disabled={!s.ready || busy} onClick={() => setReview(true)}>
              {s.ready ? "Review what will be submitted" : `Fix ${failing.length} item${failing.length === 1 ? "" : "s"} first`}</button>
          : <>
              <div className="t">This will place {s.files.samples} sample files and {s.files.reports} report{s.files.reports === 1 ? "" : "s"} in the school's {s.lp} folder.</div>
              <div className="meta">Nothing is overwritten or deleted. {s.files.already_there ? `${s.files.already_there} already there will be kept. ` : ""}Bench checks the list again before it copies; if anything changed, it places nothing.</div>
              <div className="row">
                <button disabled={busy} onClick={() => setReview(false)}>Cancel</button>
                <button className="primary" disabled={busy} onClick={() => void go(lpSubmit(s.lp, s.plan_hash), submitKey)}>Submit {s.lp}</button>
              </div>
            </>}
        {err && <div className="err">{err}</div>}
      </div>
    </>
  );
}
