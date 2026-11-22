import { useState } from "react";
import { hsAttach, sentKey } from "./lib/inbox.ts";
import type { HsAttach, HsAttachEntry } from "./lib/snapshot.ts";
import { useSent } from "./Answer.tsx";
import type { Sender } from "./Answer.tsx";

const md = (d: string) => (d ? `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}` : "no date");

/** A worksheet the matcher could not place, and the entries it could belong to (Bench feedback 0e82bbd8, Wade 2026-11-21).
    Tap an entry, then confirm. Bench checks the pairing again before it attaches the file to that entry, so a stale
    screen cannot attach something it no longer offers. Names and files never reach this screen. */
export default function MapWorksheets({ a, send, can }: { a: HsAttach; send: Sender; can: boolean }) {
  const { waiting, mark } = useSent();
  const [pick, setPick] = useState<{ file: string; entry: HsAttachEntry } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async (file: string, entry: string) => {
    setBusy(true); setErr("");
    const m = await send(hsAttach(file, entry));
    setBusy(false);
    if (m) setErr(m); else { mark(sentKey("h", file)); setPick(null); }
  };
  return (
    <>
      <h2>Worksheets to map · {a.items.length}{a.more ? `+${a.more}` : ""}</h2>
      <div className="meta">These files were not matched to an entry automatically. Pick the entry each belongs to.</div>
      {a.items.map((it) => {
        const key = sentKey("h", it.id);
        const sent = waiting(key);
        return (
          <div className="card" key={it.id}>
            <div className="t">{it.subject} worksheet · {md(it.date)}</div>
            {sent ? <div className="ok">Sent. Bench maps it within 15 minutes; this list updates after that.</div>
              : !can ? <div className="meta">Connect Dropbox in Settings to map it.</div>
              : pick?.file === it.id ? (
                <>
                  <div className="t">Map it to the {md(pick.entry.date)} {pick.entry.type || "entry"} ({pick.entry.minutes} min)?</div>
                  {pick.entry.text && <div className="meta">{pick.entry.text}</div>}
                  <div className="row">
                    <button disabled={busy} onClick={() => setPick(null)}>Cancel</button>
                    <button className="primary" disabled={busy} onClick={() => void go(it.id, pick.entry.id)}>Map it</button>
                  </div>
                </>
              ) : it.entries.map((e) => (
                <button key={e.id} className="wide" disabled={busy} onClick={() => setPick({ file: it.id, entry: e })}>
                  {md(e.date)} · {e.type || "Entry"} · {e.minutes} min{e.worksheet ? " · worksheet" : ""}{e.text ? ` · ${e.text.slice(0, 40)}` : ""}
                </button>))}
            {err && pick?.file === it.id && <div className="err">{err}</div>}
          </div>);
      })}
    </>
  );
}
