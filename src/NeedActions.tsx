import { useState } from "react";
import { needAct, sentKey } from "./lib/inbox.ts";
import type { NeedCard, NeedDo } from "./lib/snapshot.ts";
import { useDraft, useSent } from "./Answer.tsx";
import type { Sender } from "./Answer.tsx";

/** The checklist (Bench E1, Wade 2026-11-19): Approve / Deny (or Check off) on one Needs card, with an optional
    comment that goes with the choice. One new inbox file; Bench applies it within 15 minutes through the same code
    as the desktop buttons, and the card leaves the list. What each button does is the card's own fixed text. */
export default function NeedActions({ c, send, can }: { c: NeedCard; send: Sender; can: boolean }) {
  const acts = c.actions ?? [];
  const [note, setNote, clear] = useDraft(`act:${c.id}`, "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { waiting, mark } = useSent();
  const key = sentKey("d", "act", c.id);
  const typed = acts.some((a) => a.do === "answer");     // a TWM interview card: the box is the answer
  const go = async (action: NeedDo) => {
    setBusy(true); setErr("");
    const m = await send(needAct(c.id, action, note, c.fp ?? ""));
    setBusy(false);
    if (m) setErr(m); else { mark(key); clear(); }
  };
  return (
    <>
      {c.decided && <div className="meta warn">You chose “{c.decided.label}” on {c.decided.at}; it is still listed.</div>}
      {c.last_try && <div className="err">“{c.last_try.label}” did not go through ({c.last_try.at}): {c.last_try.message}</div>}
      {c.held_back?.length ? (
        <>
          {/* Private text (Bench 2026-11-19): the buttons show, switched off, so the card is never just missing. */}
          <div className="row">{c.held_back.map((l) => <button key={l} disabled>{l}</button>)}</div>
          <div className="meta">{c.lock || "Open it on the desktop to decide."}</div>
        </>
      ) : null}
      {!acts.length ? null : waiting(key) ? <div className="meta">Sent. Bench applies it within 15 minutes.</div> : can ? (
        <>
          {typed && <textarea className="ans" rows={3} maxLength={1000} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Your answer, then tap Answer" />}
          <div className="row">
            {acts.map((a) => (
              <button key={a.do} className={a.do === "approve" ? "primary" : ""} disabled={busy || (a.do === "answer" && !note.trim())} title={a.effect} onClick={() => void go(a.do)}>{a.label}</button>
            ))}
          </div>
          <details className="need-more">
            <summary className="meta">{typed ? "What these do" : "What these do · add a comment"}</summary>
            {acts.map((a) => <div key={a.do} className="meta"><b>{a.label}:</b> {a.effect}</div>)}
            {!typed && <textarea className="ans" rows={2} maxLength={1000} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Comment (optional, goes with your choice)" />}
          </details>
          {err && <div className="err">{err}</div>}
        </>
      ) : null}
    </>
  );
}
