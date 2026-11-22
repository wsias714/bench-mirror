import { test } from "node:test";
import assert from "node:assert/strict";
import { ageMinutes, agoLabel, dueLabel, isStale, parseSnapshot, pill, stateAsOf, stateDue } from "./snapshot.ts";

const base = {
  schema: 1, generated_at: "2026-10-23T12:00:00+00:00", stale_after_min: 45, read_only: true,
  today: { counts: { overdue: 0, upcoming: 0, active: 0 }, top: [], outstanding: [] },
  deck: [], week: [], twm: { available: false },
  threads: { as_of: "", error: "", needs_you: 0, items: [] }, inbox: { dir: "inbox", accepts: [], applied: [] },
};
const t0 = Date.parse(base.generated_at);

test("threads.pass is optional and carries keep-moving rows", () => {
  assert.equal(parseSnapshot(JSON.stringify(base)).threads.pass, undefined);
  const row = { title: "Sample item", state: "moved on", since: "2026-10-30", moved_on: true };
  const s = parseSnapshot(JSON.stringify({ ...base, threads: { ...base.threads, pass: [row] } }));
  assert.deepEqual(s.threads.pass, [row]);
});

test("threads.housekeeping is optional and carries numbered items", () => {
  assert.equal(parseSnapshot(JSON.stringify(base)).threads.housekeeping, undefined);
  const hk = { day: "2026-11-11", items: [{ n: 1, title: "Sample change", change: "a setting", verdict: "approve" }], more: 0, stale: 1, fixed: 2 };
  const s = parseSnapshot(JSON.stringify({ ...base, threads: { ...base.threads, housekeeping: hk } }));
  assert.deepEqual(s.threads.housekeeping, hk);
});

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

test("state is optional (older snapshot) and carries rows", () => {
  assert.equal(parseSnapshot(JSON.stringify(base)).state, undefined);
  const state = { available: true, generated_at: base.generated_at, rows: [], system: { color: "green", why: "all checks pass", checks: [] } };
  assert.deepEqual(parseSnapshot(JSON.stringify({ ...base, state })).state, state);
});

test("stateAsOf warns past two hours and on an unreadable stamp", () => {
  assert.equal(stateAsOf(base, t0 + 119 * 60000).warn, false);
  assert.equal(stateAsOf(base, t0 + 121 * 60000).warn, true);
  assert.match(stateAsOf(base, t0).label, /^as of \d\d:\d\d$/);
  assert.equal(stateAsOf({ generated_at: "garbage" }).warn, true);
  const old = { ...base, state: { generated_at: "2026-10-23T08:00:00+00:00" } };
  assert.equal(stateAsOf(old, t0).warn, true); // the state's own stamp wins
  assert.equal(stateDue(-3), "3d overdue");
  assert.equal(stateDue(null), "");
});

import { aheadLine, decisionLine, handledLine, needChip, needsSummary, todayMore, waitingLabel } from "./snapshot.ts";
test("needs summary counts the cards not shown, with no private tag (Wade 2026-11-18)", () => {
  assert.equal(needsSummary({ available: true, count: 10, private: 1, more: 0, unreadable: 0 }), "10 waiting on you · 1 more on the desktop");
  assert.equal(needsSummary({ available: true, count: 10, private: 2, more: 3 }), "10 waiting on you · 5 more on the desktop");
  // every card is on the phone now: placeholders are cards, not "more"
  assert.equal(needsSummary({ available: true, count: 4, private: 0, private_shown: 2, more: 0 }), "4 waiting on you");
  assert.doesNotMatch(needsSummary({ available: true, count: 4, private: 2 }), /private/);
  assert.equal(needsSummary({ available: true, count: 0 }), "0 waiting on you");
  // Bench 2026-11-19 evening: no placeholders; patient-data cards are a count only
  assert.equal(needsSummary({ available: true, count: 30, private: 0, desk_only: 1 }), "30 waiting on you · 1 item on desktop only");
  assert.equal(needsSummary({ available: true, count: 30, desk_only: 2 }), "30 waiting on you · 2 items on desktop only");
  assert.match(needsSummary({ available: true, count: 3, unreadable: 1 }), /unreadable, list may be short/);
});
test("waiting label counts whole days from since", () => {
  const now = Date.parse("2026-11-18T09:00:00");
  assert.equal(waitingLabel("2026-11-08", now), "waiting 10d");
  assert.equal(waitingLabel("2026-11-18", now), "new today");
  assert.equal(waitingLabel("2026-11-17", now), "since yesterday");
  assert.equal(waitingLabel("", now), "");
});

import { tabBadge } from "./snapshot.ts";
test("tab badges come from the one Needs list, threads fall back to the thread count", () => {
  const base = { threads: { as_of: "", error: "", needs_you: 4, items: [] } } as unknown as Parameters<typeof tabBadge>[0];
  assert.equal(tabBadge({ ...base, needs: { available: true, by_tab: { today: 6, twm: 2, threads: 1 } } }, "twm"), 2);
  assert.equal(tabBadge({ ...base, needs: { available: true, by_tab: { today: 6, twm: 2, threads: 1 } } }, "threads"), 1);
  assert.equal(tabBadge({ ...base, needs: { available: true, by_tab: { today: 6 } } }, "deck"), 0);
  assert.equal(tabBadge({ ...base, needs: { available: true, by_tab: { today: 6 } } }, "today"), 6);
  assert.equal(tabBadge({ ...base, needs: { available: false } }, "threads"), 4);   // old snapshot: old badge
  assert.equal(tabBadge({ ...base, needs: { available: false } }, "twm"), 0);
  assert.equal(tabBadge(null, "twm"), 0);
});

import { splitNeeds } from "./snapshot.ts";
test("needs split into his items and system upkeep; an old snapshot is all life", () => {
  const it = (id: string, group?: string) => ({ id, kind: "k", title: id, context: "", reply: "r", since: "", due: "", group });
  const s = splitNeeds({ available: true, items: [it("a", "life"), it("b", "upkeep"), it("c")], upkeep: [{ kind: "k", count: 1, reply: "x" }] });
  assert.deepEqual(s.life.map((c) => c.id), ["a", "c"]);
  assert.deepEqual(s.upkeep.map((c) => c.id), ["b"]);
  assert.equal(s.groups.length, 1);
  assert.deepEqual(splitNeeds({ available: true }), { life: [], upkeep: [], groups: [], finished: [] });
  const f = splitNeeds({ available: true, items: [it("a", "life"), it("d", "finished")] });
  assert.deepEqual([f.life.map((c) => c.id), f.finished.map((c) => c.id)], [["a"], ["d"]]);
});

test("Today's 'more on the desktop' line counts the rest and the private rows, untagged", () => {
  assert.equal(todayMore({ more: 2, hidden: 3 }), "5 more on the desktop");
  assert.equal(todayMore({}), "");
  assert.equal(todayMore({ hidden: 1 }), "1 more on the desktop");
});

test("a recent choice says whether it applied, and why not", () => {
  assert.equal(decisionLine({ title: "Garden idea", label: "Build it", by: "phone", at: "2026-11-19T09:00", ok: true, message: "" }), "Build it · Garden idea · applied");
  assert.equal(decisionLine({ title: "Fix", label: "Approve", by: "desk", at: "", ok: false, message: "the file changed" }), "Approve · Fix · did not apply: the file changed");
});

test("a card's chip is Bench's tag in plain words, never a raw kind name (Bench 11-20)", () => {
  assert.equal(needChip({ kind: "thread_waiting", label: "Task + Thread" }), "Task + Thread");
  assert.equal(needChip({ kind: "bench_item" }), "Task");
  assert.equal(needChip({ kind: "some_new_kind" }), "Item");
  assert.equal(needChip({ kind: "registry_held" }), "Held change"); // a held seed change: text only, its buttons are desk-only
});

test("what the nightly loop handled reads as one line each", () => {
  assert.equal(handledLine({ what: "Closed", title: "Sample bill", at: "2026-11-24T04:05", undone: false, id: "r1" }), "Closed · Sample bill");
  assert.equal(handledLine({ what: "Moved", title: "Sample bill", at: "", undone: true, id: "r2" }), "Moved · Sample bill · undone");
});

test("what is about to slip reads as one line each", () => {
  assert.equal(aheadLine({ why: "Due soon, nothing moving it", title: "Sample", when: "2026-11-24" }), "Due soon, nothing moving it · Sample · 11-24");
  assert.equal(aheadLine({ why: "Two cards on one matter", title: "Sample", when: "" }), "Two cards on one matter · Sample");
});
