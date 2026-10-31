import { createContext, useContext, useState } from "react";
import { sentKey, twmFeedback } from "./lib/inbox.ts";
import type { Feedback } from "./lib/snapshot.ts";
import { useDraft, useSent } from "./Answer.tsx";
import type { Sender } from "./Answer.tsx";

export const FEEDBACK_FILES = { timeline: "ops/TIMELINE.md", delivery: "ops/DELIVERY.md" } as const;
export const FeedbackCtx = createContext<{ items: Feedback[]; send: Sender; can: boolean }>({ items: [], send: async () => "", can: false });
const one = (t: string) => t.replace(/[*`_]/g, "").replace(/\s+/g, " ").trim().slice(0, 200);

/** A comment button on one goal, target or milestone, with what Wade already said there and TWM's answer. */
export default function Comment({ file, where, item }: { file: string; where: string; item: string }) {
  const { items, send, can } = useContext(FeedbackCtx);
  const it = one(item);
  const [text, setText, clear] = useDraft(`fb:${where}|${it}`, "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { waiting, mark } = useSent();
  const key = sentKey("d", "fb", `${where}|${it}`.slice(0, 120));
  const mine = items.filter((f) => f.where === where && f.item === it);
  const go = async () => {
    setBusy(true); setErr("");
    const m = await send(twmFeedback(file, where, it, text));
    setBusy(false);
    if (m) setErr(m); else { mark(key); clear(); setOpen(false); }
  };
  return (
    <div className="fb">
      {mine.map((f, i) => (
        <div className={`fb-note ${f.status}`} key={i}>
          <span className="eyebrow">{f.id ? `${f.id} · ` : ""}{f.status === "answered" ? `answered ${f.answered}` : "picked up tonight"}</span> {f.text}
          {f.status === "answered" && f.answer && <div className="fb-ans">{f.answer}</div>}
        </div>))}
      {waiting(key) && <div className="meta">Comment sent. Bench files it within 15 minutes; TWM picks it up tonight.</div>}
      {can && !open && <button className="fb-btn" onClick={() => setOpen(true)}>Comment</button>}
      {open && (
        <>
          <textarea className="ans" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your comment. TWM picks it up tonight." autoFocus />
          <div className="row">
            <button disabled={busy} onClick={() => setOpen(false)}>Close</button>
            <button className="primary" disabled={busy || !text.trim()} onClick={() => void go()}>Send comment</button>
          </div>
          {err && <div className="err">{err}</div>}
        </>)}
    </div>
  );
}
