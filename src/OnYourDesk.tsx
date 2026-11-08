import { useState } from "react";
import { queueAnswer, sentKey } from "./lib/inbox.ts";
import type { Payload } from "./lib/inbox.ts";
import type { DeskAction, DeskActions } from "./lib/snapshot.ts";
import { useDraft, useSent } from "./Answer.tsx";
import type { Sender } from "./Answer.tsx";

function Row({ a, send, can }: { a: DeskAction; send: Sender; can: boolean }) {
  const { waiting, mark } = useSent();
  const [text, setText, clearText] = useDraft(`act:${a.id}`, "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const key = sentKey("p", `act:${a.id}`);
  if (waiting(key)) return null; // sent from here: it drops off at once, like the desktop
  const go = async (p: Payload) => {
    setBusy(true); setErr("");
    const m = await send(p);
    setBusy(false);
    if (m) setErr(m); else { mark(key); clearText(); }
  };
  const decision = a.kind === "decision" && a.qid;
  return (
    <div className="card need">
      <div>{a.nudge && a.waiting_days ? <span className="chip warn">Waiting {a.waiting_days} days</span> : null} <b>{a.title}</b></div>
      {a.action && <div className="meta">{a.action}{a.due ? ` · due ${a.due}` : ""}</div>}
      {a.pdf && <div className="meta">PDF: open it on the desktop.</div>}
      {a.kind === "checkin" && <div className="meta">Answer it in the check-in card further down.</div>}
      {can && decision && (
        <>
          <input className="ans" value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" maxLength={2000} />
          <div className="row"><button className="primary" disabled={busy || !text.trim()} onClick={() => void go(queueAnswer(a.qid, text))}>Answer</button></div>
        </>)}
      {a.kind !== "decision" && a.kind !== "checkin" && <div className="meta">Mark it done on the desktop.</div>}
      {!can && decision && <div className="meta">Connect Dropbox in Settings to answer.</div>}
      {err && <div className="err">{err}</div>}
    </div>
  );
}

/** TWM's "On your desk" list (ops/desk-actions.json): everything waiting on you, one action per row. */
export default function OnYourDesk({ d, send, can }: { d?: DeskActions; send: Sender; can: boolean }) {
  if (!d?.available) return null;
  const items = d.items ?? [];
  return (
    <>
      <h2>On your desk</h2>
      <div className="meta">{items.length} waiting on you{d.waiting ? ` · ${d.waiting} for 2+ days` : ""}</div>
      {items.length ? items.map((a) => <Row key={a.id} a={a} send={send} can={can} />) : <div className="empty">Nothing needs you. TWM will put anything new here.</div>}
    </>
  );
}
