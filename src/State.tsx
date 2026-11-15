import { stateAsOf, stateDue } from "./lib/snapshot.ts";
import type { Snapshot, StateColor, StateRow } from "./lib/snapshot.ts";

/** State of everything: one row per domain plus System. Read-only, no controls. */
const dot = (c: StateColor) => <span className={`stdot ${c}`} aria-label={c} role="img" />;

function Row({ r }: { r: StateRow }) {
  const counts = [
    r.overdue ? `${r.overdue} overdue` : "",
    r.in_window ? `${r.in_window} soon` : "",
    r.ready_for_you ? `${r.ready_for_you} ready for you` : "",
    r.to_confirm ? `${r.to_confirm} to confirm` : "",
  ].filter(Boolean).join(" · ");
  return (
    <div className="card">
      <div className="t">{dot(r.color)}{r.label}</div>
      <div className="meta">{r.why}</div>
      {r.next && (
        <div className="meta">
          Next: {r.next.title ?? "(details withheld)"}
          {r.next.days !== null && <> · {r.next.days < 0 ? <span className="bad">{stateDue(r.next.days)}</span> : stateDue(r.next.days)}</>}
          {r.next.due ? <> · {r.next.due}</> : null}
        </div>
      )}
      {counts && counts !== r.why && <div className="meta">{counts}</div>}
    </div>
  );
}

export default function StateView({ s, now }: { s: Snapshot; now: number }) {
  const st = s.state;
  if (!st || !st.available || !st.rows) return <div className="empty">Not available yet</div>;
  const a = stateAsOf(s, now);
  return (
    <>
      <div className={`asof${a.warn ? " warn" : ""}`}>{a.warn ? "⚠ " : ""}{a.label}{a.warn ? " · older than 2 hours, treat as out of date" : ""}</div>
      {st.rows.map((r) => <Row key={r.key} r={r} />)}
      {st.system && (
        <div className="card">
          <div className="t">{dot(st.system.color)}System</div>
          <div className="meta">{st.system.why}</div>
          {st.system.checks.map((c) => (
            <div key={c.name} className="meta"><span className={c.ok ? "ok" : "bad"}>{c.ok ? "✓" : "✗"}</span> {c.name}: {c.detail}</div>
          ))}
        </div>
      )}
    </>
  );
}
