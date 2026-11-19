import { useState } from "react";
import { itemNote, sentKey } from "./lib/inbox.ts";
/** Anything with notes: a Today/Week row, or a Needs card. */
type Noted = { id: string; notes?: number; note_list?: { at: string; by: string; text: string }[] };
import { useDraft, useSent } from "./Answer.tsx";
import type { Sender } from "./Answer.tsx";

/** Progress notes on one card: the newest few from the snapshot, plus a box that sends a new one. */
export default function CardNotes({ e, send, can }: { e: Noted; send: Sender; can: boolean }) {
  const [text, setText, clear] = useDraft(`note:${e.id}`, "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { waiting, mark } = useSent();
  const key = sentKey("d", "note", e.id);
  const go = async () => {
    setBusy(true); setErr("");
    const m = await send(itemNote(e.id, text));
    setBusy(false);
    if (m) setErr(m); else { mark(key); clear(); setOpen(false); }
  };
  return (
    <div className="fb">
      {(e.note_list ?? []).map((n, i) => (
        <div className="fb-note answered" key={i}><span className="eyebrow">{n.at} · {n.by}</span> {n.text}</div>))}
      {waiting(key) && <div className="meta">Note sent. Bench files it within 15 minutes.</div>}
      {can && !open && <button className="fb-btn" onClick={() => setOpen(true)}>{e.notes ? `Notes (${e.notes}) · add` : "Add note"}</button>}
      {open && (
        <>
          <textarea className="ans" rows={3} maxLength={1000} value={text} onChange={(ev) => setText(ev.target.value)} placeholder="Partial progress, e.g. asked 3 contractors on Thumbtack" autoFocus />
          <div className="row">
            <button disabled={busy} onClick={() => setOpen(false)}>Close</button>
            <button className="primary" disabled={busy || !text.trim()} onClick={() => void go()}>Save note</button>
          </div>
          {err && <div className="err">{err}</div>}
        </>)}
    </div>
  );
}
