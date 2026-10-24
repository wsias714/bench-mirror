import { test } from "node:test";
import assert from "node:assert/strict";
import { ageMinutes, agoLabel, dueLabel, isStale, parseSnapshot, pill } from "./snapshot.ts";

const base = {
  schema: 1, generated_at: "2026-10-23T12:00:00+00:00", stale_after_min: 45, read_only: true,
  today: { counts: { overdue: 0, upcoming: 0, active: 0 }, top: [], outstanding: [] },
  deck: [], week: [], twm: { available: false },
  threads: { as_of: "", error: "", needs_you: 0, items: [] }, inbox: { dir: "inbox", accepts: [], applied: [] },
};
const t0 = Date.parse(base.generated_at);

test("parseSnapshot accepts a good file and rejects bad ones", () => {
  assert.equal(parseSnapshot(JSON.stringify(base)).schema, 1);
  assert.throws(() => parseSnapshot("{}"), /schema/);
  assert.throws(() => parseSnapshot(JSON.stringify({ ...base, schema: 2 })), /newer/);
  assert.throws(() => parseSnapshot(JSON.stringify({ ...base, deck: undefined })), /missing/);
  assert.throws(() => parseSnapshot("not json"));
});

test("age and staleness", () => {
  assert.equal(ageMinutes(base, t0 + 20 * 60000), 20);
  assert.equal(ageMinutes({ generated_at: "garbage" }), null);
  assert.equal(isStale(base, t0 + 40 * 60000), false);
  assert.equal(isStale(base, t0 + 50 * 60000), true);
  assert.equal(isStale({ generated_at: "garbage", stale_after_min: 45 }), true);
});

test("labels", () => {
  assert.equal(agoLabel(0), "just now");
  assert.equal(agoLabel(5), "5m ago");
  assert.equal(agoLabel(180), "3h ago");
  assert.equal(agoLabel(3000), "2d ago");
  assert.equal(dueLabel(-3), "3d overdue");
  assert.equal(dueLabel(0), "today");
  assert.equal(dueLabel(1), "tomorrow");
  assert.equal(dueLabel(4), "in 4d");
});

test("pill states", () => {
  const s = parseSnapshot(JSON.stringify(base));
  const o = { connected: true, loading: false, error: "", snap: s, fromCache: false };
  assert.equal(pill({ ...o, connected: false }).kind, "off");
  assert.equal(pill({ ...o, snap: null, loading: true }).kind, "syncing");
  assert.equal(pill(o, t0 + 10 * 60000).kind, "ok");
  assert.equal(pill(o, t0 + 90 * 60000).kind, "stale");
  assert.equal(pill({ ...o, fromCache: true }, t0 + 10 * 60000).kind, "offline");
  assert.equal(pill({ ...o, snap: null, error: "boom" }).text, "boom");
});
