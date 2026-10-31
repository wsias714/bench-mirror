import { useEffect, useState } from "react";
import { deskAnswers, isWaiting, pruneSent, queueAcceptDefault, queueAnswer, sentKey } from "./lib/inbox.ts";
import type { Payload, Sent } from "./lib/inbox.ts";
import type { Desk, Twm } from "./lib/snapshot.ts";

/** Send one payload; resolves to "" on success or a readable message. */
export type Sender = (p: Payload) => Promise<string>;

const SENT_KEY = "bm-sent";
const loadSent = (): Sent => {
  try { return pruneSent(JSON.parse(localStorage.getItem(SENT_KEY) || "{}") as Sent); } catch { return {}; }
};
const saveSent = (s: Sent) => { try { localStorage.setItem(SENT_KEY, JSON.stringify(s)); } catch { /* per-viewer convenience only */ } };

/** Answers sent from this phone and not yet seen in a snapshot. */
export function useSent() {
  const [sent, setSent] = useState<Sent>(loadSent);
  const mark = (key: string) => setSent((s) => { const n = { ...s, [key]: Date.now() }; saveSent(n); return n; });
  return { waiting: (key: string) => isWaiting(sent, key), mark };
}

/** useState that keeps its value in localStorage per entry, so a half-typed answer survives leaving the app.
    Pass "" as the key to skip storage. A per-viewer convenience only: reads and writes never throw. */
export function useDraft<T>(key: string, empty: T): [T, (v: T) => void, () => void] {
  const full = `bm-draft:${key}`;
  const read = (): T => { try { const r = localStorage.getItem(full); return r ? (JSON.parse(r) as T) : empty; } catch { return empty; } };
  const [v, setV] = useState<T>(read);
  useEffect(() => { setV(read()); }, [full]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (n: T) => { setV(n); try { if (JSON.stringify(n) === JSON.stringify(empty)) localStorage.removeItem(full); else localStorage.setItem(full, JSON.stringify(n)); } catch { /* ignore */ } };
  const clear = () => { setV(empty); try { localStorage.removeItem(full); } catch { /* ignore */ } };
  return [v, set, clear];
}

const APPLIES = "Answered, applies at the next 23:00 cycle";
const WAIT = "Sent. Bench picks it up within 15 minutes.";

export function QueueCard({ q, send, can }: { q: NonNullable<Twm["decisions_waiting"]>[number]; send: Sender; can: boolean }) {
  const { waiting, mark } = useSent();
  const [text, setText, clearText] = useDraft(`q:${q.id}`, "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const key = sentKey("q", q.id);
  const go = async (p: Payload) => {
    setBusy(true); setErr("");
    const m = await send(p);
    setBusy(false);
    if (m) setErr(m); else { mark(key); clearText(); }
  };
  return (
    <div className="card">
      <div className="t">{q.id} · due {q.due}{q.class === "waits" ? " · waits for you" : ""}</div>
      <div className="meta">{q.q}</div>
      {q.answer ? <div className="ok">{APPLIES}: {q.answer}</div>
        : waiting(key) ? <div className="meta">{WAIT}</div>
        : can ? (
          <>
            {q.default && <div className="meta">Default: {q.default}</div>}
            <input className="ans" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type an answer" maxLength={2000} />
            <div className="row">
              {q.default && <button disabled={busy} onClick={() => void go(queueAcceptDefault(q.id))}>Accept default</button>}
              <button className="primary" disabled={busy || !text.trim()} onClick={() => void go(queueAnswer(q.id, text))}>Send answer</button>
            </div>
          </>
        ) : <div className="meta">Connect Dropbox in Settings to answer.</div>}
      {err && <div className="err">{err}</div>}
    </div>
  );
}

export function DeskCard({ d, send, can }: { d: Desk; send: Sender; can: boolean }) {
  const { waiting, mark } = useSent();
  const sid = d.id ?? "";
  const [pick, setPick, clearPick] = useDraft<Record<string, string>>(`desk:${sid}:pick`, {});
  const [note, setNote, clearNote] = useDraft<Record<string, string>>(`desk:${sid}:note`, {});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const qs = d.questions ?? [];
  const open = qs.filter((q) => !q.answer && !waiting(sentKey("d", sid, q.id)));
  const ready = Object.fromEntries(open.filter((q) => pick[q.id] || (note[q.id] ?? "").trim())
    .map((q) => [q.id, { choice: pick[q.id] ?? "", note: (note[q.id] ?? "").trim() }]));
  const submit = async () => {
    setBusy(true); setErr("");
    const m = await send(deskAnswers(sid, ready));
    setBusy(false);
    if (m) setErr(m); else { Object.keys(ready).forEach((id) => mark(sentKey("d", sid, id))); clearPick(); clearNote(); }
  };
  return (
    <>
      <h2>CEO desk · {d.title}</h2>
      {d.intro && <p className="meta">{d.intro}</p>}
      {qs.map((q) => (
        <div className="card" key={q.id}>
          {q.section && <div className="eyebrow">{q.section}</div>}
          <div className="t">{q.text}</div>
          {q.why && <div className="meta"><b>Why</b> {q.why}</div>}
          {q.lean && <div className="meta"><b>Lean</b> {q.lean}</div>}
          {q.answer ? <div className="ok">{APPLIES}: {[q.answer.choice, q.answer.note].filter(Boolean).join(". ")}</div>
            : waiting(sentKey("d", sid, q.id)) ? <div className="meta">{WAIT}</div>
            : can ? (
              <>
                <div className="opts">{q.options.map((o) => (
                  <button key={o} className={pick[q.id] === o ? "on" : ""} onClick={() => setPick({ ...pick, [q.id]: pick[q.id] === o ? "" : o })}>{o}</button>))}</div>
                <input className="ans" value={note[q.id] ?? ""} onChange={(e) => setNote({ ...note, [q.id]: e.target.value })} placeholder="Add a note (optional)" maxLength={2000} />
              </>
            ) : null}
        </div>))}
      {open.length > 0 && can && <button className="primary wide" disabled={busy || !Object.keys(ready).length} onClick={() => void submit()}>Submit {Object.keys(ready).length || ""} answer{Object.keys(ready).length === 1 ? "" : "s"}</button>}
      {open.length > 0 && !can && <div className="meta">Connect Dropbox in Settings to answer.</div>}
      {err && <div className="err">{err}</div>}
      <div className="meta">Unanswered questions run on their lean.</div>
    </>
  );
}
