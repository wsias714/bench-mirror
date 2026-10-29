import { useCallback, useEffect, useState } from "react";
import { SNAPSHOT_PATH } from "./config.ts";
import { resetApp } from "./Boundary.tsx";
import {
  describeError, dropboxRemote, finishAuthFromUrl, finishAuthWithCode, getAppKey,
  isAuthError, isConnected, isScopeError, setAppKey, signOut, startAuth,
} from "./lib/dropbox.ts";
import { loadCached, saveCached } from "./lib/store.ts";
import { agoLabel, ageMinutes, dueLabel, parseSnapshot, pill } from "./lib/snapshot.ts";
import type { Card, Ev, Snapshot, Thread } from "./lib/snapshot.ts";
import Timeline from "./Timeline.tsx";
import HomeschoolView from "./Homeschool.tsx";
import TwmView from "./Twm.tsx";
import { sendToInbox } from "./lib/inbox.ts";
import type { Payload } from "./lib/inbox.ts";

type Tab = "today" | "deck" | "week" | "timeline" | "school" | "twm" | "threads";
const TABS: [Tab, string][] = [["today", "Today"], ["deck", "Deck"], ["week", "Week"], ["timeline", "Timeline"], ["school", "School"], ["twm", "TWM"], ["threads", "Threads"]];

const readCached = (): Snapshot | null => {
  const t = loadCached();
  if (!t) return null;
  try {
    return parseSnapshot(t);
  } catch {
    return null;
  }
};

function EventRow({ e }: { e: Ev }) {
  return (
    <div className="card">
      <div className="t">{e.title}</div>
      <div className="meta"><span className="chip">{e.domain}</span>{e.days !== null && e.days < 0 ? <span className="bad">{dueLabel(e.days)}</span> : dueLabel(e.days)} · {e.due}</div>
    </div>
  );
}
const CardRow = ({ c }: { c: Card }) => (
  <div className="card">
    <div className="t">{c.title}</div>
    <div className="meta"><span className="chip">{c.outcome || c.kind}</span>{c.domain} · {c.created}</div>
  </div>
);
const ThreadRow = ({ t }: { t: Thread }) => (
  <div className={`card${t.needs_you ? " need" : ""}`}>
    <div className="t">{t.title}</div>
    <div className="meta"><span className="chip">{t.project}</span>{t.status}{t.needs_you ? " · needs you" : ""}</div>
  </div>
);
const Empty = ({ text }: { text: string }) => <div className="empty">{text}</div>;

/** The phone's one write: a new file under inbox/. Returns "" or a message to show. */
async function sendAnswer(p: Payload): Promise<string> {
  try {
    await sendToInbox(dropboxRemote(), p);
    return "";
  } catch (e) {
    if (isScopeError(e)) return "This Dropbox login is read-only. Open Settings, sign out, and connect again to allow answers.";
    if (isAuthError(e)) return "Dropbox login expired. Open Settings and reconnect.";
    return `Not sent: ${describeError(e)}`;
  }
}

function Body({ tab, s }: { tab: Tab; s: Snapshot }) {
  if (tab === "today") {
    const c = s.today.counts;
    return (
      <>
        <div className="stats"><b>{c.overdue}</b> overdue · <b>{c.upcoming}</b> upcoming · {c.active} active</div>
        <h2>Top of the list</h2>
        {s.today.top.length ? s.today.top.map((e) => <EventRow key={e.id} e={e} />) : <Empty text="Nothing ranked today." />}
        <h2>Outstanding (oldest first)</h2>
        {s.today.outstanding.length ? s.today.outstanding.map((e) => <EventRow key={e.id} e={e} />) : <Empty text="Nothing overdue." />}
      </>
    );
  }
  if (tab === "deck") return s.deck.length ? <>{s.deck.map((c) => <CardRow key={c.id} c={c} />)}</> : <Empty text="Deck is clear." />;
  if (tab === "week") return s.week.length ? <>{s.week.map((e) => <EventRow key={e.id} e={e} />)}</> : <Empty text="No deadlines in the next 7 days." />;
  if (tab === "timeline") return s.timeline ? <Timeline tl={s.timeline} /> : <Empty text="Timeline arrives with the next Bench update (within 15 minutes)." />;
  if (tab === "school") return <HomeschoolView h={s.homeschool} send={sendAnswer} can={isConnected()} />;
  if (tab === "threads") {
    return (
      <>
        <div className="stats"><b>{s.threads.needs_you}</b> waiting on you · as of {s.threads.as_of.slice(11, 16) || "?"}</div>
        {s.threads.error && <p className="err">{s.threads.error}</p>}
        {s.threads.items.length ? s.threads.items.map((t, i) => <ThreadRow key={i} t={t} />) : <Empty text="No live threads." />}
      </>
    );
  }
  return <TwmView t={s.twm} send={sendAnswer} can={isConnected()} />;
}

export default function App() {
  const [tab, setTab] = useState<Tab>(() => (TABS.find(([k]) => k === localStorage.getItem("bm-tab")) ?? TABS[0])[0]);
  const [snap, setSnap] = useState<Snapshot | null>(readCached);
  const [fromCache, setFromCache] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(isConnected());
  const [sheet, setSheet] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    if (!isConnected()) return;
    setLoading(true);
    try {
      const f = await dropboxRemote().read(SNAPSHOT_PATH);
      if (!f) throw new Error("No snapshot.json in the app folder yet. Bench writes one every 15 minutes.");
      const parsed = parseSnapshot(f.text);
      saveCached(f.text);
      setSnap(parsed);
      setFromCache(false);
      setError("");
    } catch (e) {
      setError(isAuthError(e) ? "Dropbox login expired. Open Settings and reconnect." : describeError(e));
      setFromCache(true);
    } finally {
      setLoading(false);
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        if ((await finishAuthFromUrl()) === "connected") setConnected(true);
      } catch (e) {
        setError(describeError(e));
      }
      void load();
    })();
    const onVis = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVis);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    const poll = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 5 * 60000);
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(tick); clearInterval(poll); };
  }, [load]);

  const p = pill({ connected, loading, error, snap, fromCache }, now);
  const pick = (t: Tab) => { setTab(t); try { localStorage.setItem("bm-tab", t); } catch { /* ignore */ } };

  return (
    <div className="app">
      <div className="top">
        <div>
          <h1>Bench</h1>
          <p className="sub">Mirror (answers TWM only){snap ? ` · as of ${agoLabel(ageMinutes(snap, now))}` : ""}</p>
        </div>
        <div className="top-r">
          <button className={`pill ${p.kind}`} onClick={() => (connected ? void load() : setSheet(true))} aria-label="Refresh"><span className="dot" />{p.text}</button>
          <button onClick={() => setSheet(true)} aria-label="Settings">⚙</button>
        </div>
      </div>
      {error && connected && <p className="err">{error}</p>}
      <nav className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => pick(k)}>
            {label}{k === "threads" && snap && snap.threads.needs_you ? <sup>{snap.threads.needs_you}</sup> : null}
          </button>
        ))}
      </nav>
      {snap ? <Body tab={tab} s={snap} /> : <Empty text={connected ? "Loading…" : "Open Settings to connect Dropbox."} />}
      {sheet && <Settings onClose={() => setSheet(false)} onChange={() => { setConnected(isConnected()); void load(); }}
        onForget={() => { setSnap(null); setConnected(false); setError(""); setSheet(false); }} />}
    </div>
  );
}

function Settings({ onClose, onChange, onForget }: { onClose: () => void; onChange: () => void; onForget: () => void }) {
  const [key, setKey] = useState(getAppKey());
  const [code, setCode] = useState("");
  const [authUrl, setAuthUrl] = useState("");
  const [msg, setMsg] = useState("");
  const connected = isConnected();

  const go = async () => {
    setAppKey(key);
    try { window.location.href = await startAuth(false); } catch (e) { setMsg(describeError(e)); }
  };
  const manual = async () => {
    setAppKey(key);
    try { setAuthUrl(await startAuth(true)); } catch (e) { setMsg(describeError(e)); }
  };
  const forget = async () => {
    setMsg("Signing out…");
    await signOut();
    onForget();
  };
  const finish = async () => {
    try { await finishAuthWithCode(code); setMsg("Connected."); onChange(); onClose(); } catch (e) { setMsg(describeError(e)); }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <p className="note">This app reads one file Bench writes to your private Dropbox app folder. It can send TWM answers (queue decisions and the CEO desk) as new files in that folder's inbox; Bench checks and applies them. It can't change anything else.</p>
        <label className="field">Dropbox app key
          <input value={key} onChange={(e) => setKey(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="from the Dropbox app console" />
        </label>
        {connected ? (
          <button className="danger" onClick={() => void forget()}>Sign out / forget this device</button>
        ) : (
          <>
            <button className="primary" disabled={!key.trim()} onClick={() => void go()}>Connect Dropbox</button>
            <p className="note">If Dropbox doesn't return you to the app, use a code instead:</p>
            <button disabled={!key.trim()} onClick={() => void manual()}>Get a code</button>
            {authUrl && <p className="note"><a href={authUrl} target="_blank" rel="noreferrer">Open Dropbox, then paste the code below</a></p>}
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste code" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            <button disabled={!code.trim()} onClick={() => void finish()}>Finish with code</button>
          </>
        )}
        {msg && <p className="note">{msg}</p>}
        <p className="note">build {__BUILD__}</p>
        <button onClick={() => void resetApp()}>Reset app (keeps Dropbox login)</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
