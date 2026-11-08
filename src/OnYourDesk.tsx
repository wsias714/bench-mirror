import { useEffect, useState } from "react";
import { dropboxRemote } from "./lib/dropbox.ts";
import { deskDone, queueAnswer, sentKey } from "./lib/inbox.ts";
import type { Payload } from "./lib/inbox.ts";
import type { Desk, DeskAction, DeskActions } from "./lib/snapshot.ts";
import { DeskCard, useDraft, useSent } from "./Answer.tsx";
import Comment, { FEEDBACK_FILES } from "./Comment.tsx";
import type { Sender } from "./Answer.tsx";

/** The PDF Bench copied into the app folder's desk/ directory, shown on the card itself. */
function PdfView({ id }: { id: string }) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    let live = true, made = "";
    dropboxRemote().readBlob?.(`/desk/${id}.pdf`).then((b) => {
      if (!live) return;
      if (!b) { setErr("The PDF isn't on the phone yet. Bench copies it within 15 minutes."); return; }
      made = URL.createObjectURL(b); setUrl(made);
    }).catch((e: unknown) => { if (live) setErr(e instanceof Error ? e.message : "Couldn't load the PDF."); });
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [id]);
  if (err) return <div className="err">{err}</div>;
  if (!url) return <div className="meta">Loading the PDF…</div>;
  return (
    <>
      <iframe className="pdf" src={url} title="PDF" />
      <a className="wide-link" href={url} target="_blank" rel="noopener">Open full screen</a>
    </>
  );
}

function Row({ a, send, can, desk }: { a: DeskAction; send: Sender; can: boolean; desk?: Desk }) {
  const { waiting, mark } = useSent();
  const [text, setText, clearText] = useDraft(`act:${a.id}`, "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const key = sentKey("p", `act:${a.id}`);
  if (waiting(key)) return null; // sent from here: it drops off at once, like the desktop
  const go = async (p: Payload) => {
    setBusy(true); setErr("");
    const m = await send(p);
    setBusy(false);
    if (m) setErr(m); else { mark(key); clearText(); }
  };
  const decision = a.kind === "decision" && a.qid;
  const checkin = a.kind === "checkin";
  // The survey is shown as itself, with no second chip saying the same thing; it keeps a comment box for the council.
  if (checkin && desk?.available && desk.id === a.set) {
    return <><DeskCard d={desk} send={send} can={can} /><div className="card"><Comment file={FEEDBACK_FILES.delivery} where="On your desk" item={a.title} /></div></>;
  }
  return (
    <div className="card need">
      <div>{a.nudge && a.waiting_days ? <span className="chip warn">Waiting {a.waiting_days} days</span> : null} <b>{a.title}</b></div>
      {a.action && <div className="meta">{a.action}{a.due ? ` · due ${a.due}` : ""}</div>}
      {a.status && <div className="meta">Status: {a.status}</div>}
      {a.kind === "pdf" && (a.pdf
        ? (show ? <PdfView id={a.id} /> : <button className="wide" onClick={() => setShow(true)}>Read the PDF here</button>)
        : <div className="meta">This PDF isn't on the phone (too large, still copying, or held back). Open it on the desktop.</div>)}
      {checkin && <div className="meta">This check-in isn't open for answers here yet.</div>}
      {can && decision && (
        <>
          <input className="ans" value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" maxLength={2000} />
          <div className="row"><button className="primary" disabled={busy || !text.trim()} onClick={() => void go(queueAnswer(a.qid, text))}>Answer</button></div>
        </>)}
      {can && !decision && !checkin && <div className="row"><button className="primary" disabled={busy} onClick={() => void go(deskDone(a.title))}>Done</button></div>}
      {!can && !checkin && <div className="meta">Connect Dropbox in Settings to respond.</div>}
      {err && <div className="err">{err}</div>}
      <Comment file={FEEDBACK_FILES.delivery} where="On your desk" item={a.title} />
    </div>
  );
}

/** TWM's "On your desk" list (ops/desk-actions.json): everything waiting on you, answered or cleared on its own card. */
export default function OnYourDesk({ d, send, can, desk }: { d?: DeskActions; send: Sender; can: boolean; desk?: Desk }) {
  if (!d?.available) return null;
  const items = d.items ?? [];
  return (
    <>
      <h2>On your desk</h2>
      <div className="meta">{items.length} waiting on you{d.waiting ? ` · ${d.waiting} for 2+ days` : ""}</div>
      {items.length ? items.map((a) => <Row key={a.id} a={a} send={send} can={can} desk={desk} />) : <div className="empty">Nothing needs you. TWM will put anything new here.</div>}
    </>
  );
}
