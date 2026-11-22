import { test } from "node:test";
import assert from "node:assert/strict";
import { deskAnswers, deskDone, hsAttach, itemNote, needAct, isWaiting, lpPick, lpSubmit, pruneSent, queueAcceptDefault, queueAnswer, sendToInbox, sentKey } from "./inbox.ts";
import type { Remote } from "./remote.ts";

const now = new Date("2026-10-28T20:00:00Z");
const ID = "11111111-2222-3333-4444-555555555555";

test("payloads carry exactly the fields Bench's schema accepts", () => {
  assert.deepEqual(queueAnswer("Q11", "  yes  ", now, ID), { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "twm_queue", qid: "Q11", answer: "yes" });
  assert.deepEqual(queueAcceptDefault("Q11", now, ID), { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "twm_queue", qid: "Q11", accept_default: true });
  assert.deepEqual(deskAnswers("s1", { q1: { choice: "A", note: "" } }, now, ID),
    { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "twm_desk", set: "s1", answers: { q1: { choice: "A", note: "" } } });
});

test("sendToInbox creates one new file named by the payload id, under inbox/", async () => {
  const calls: [string, string][] = [];
  const remote: Remote = { read: async () => null, create: async (p, t) => { calls.push([p, t]); } };
  const p = queueAnswer("Q12", "x", now, ID);
  assert.equal(await sendToInbox(remote, p), `/inbox/${ID}.json`);
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(calls[0][1]), p);
});

test("sent markers expire so a rejected answer can be retried", () => {
  const t = Date.parse("2026-10-28T20:00:00Z");
  const k = sentKey("d", "set1", "q1");
  assert.equal(k, "d:set1:q1");
  assert.equal(isWaiting({ [k]: t }, k, t + 60_000), true);
  assert.equal(isWaiting({ [k]: t }, k, t + 4 * 3600_000), false);
  assert.deepEqual(pruneSent({ a: t, b: t - 5 * 3600_000 }, t), { a: t });
});

test("LP pick and submit payloads carry exactly the fields Bench's schema accepts", () => {
  assert.deepEqual(lpPick("LP2", "2026-10-25|Science", true, now, ID),
    { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "lp_pick", lp: "LP2", key: "2026-10-25|Science", picked: true });
  assert.deepEqual(lpSubmit("LP2", "0123456789abcdef", now, ID),
    { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "lp_submit", lp: "LP2", plan_hash: "0123456789abcdef" });
});

test("Done on a desk item is a twm_feedback comment aimed at On your desk", () => {
  assert.deepEqual(deskDone("Sign it", now, ID), { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "twm_feedback", file: "ops/DELIVERY.md", where: "On your desk", item: "Sign it", text: "Done (marked from phone)" });
});

test("a card note is the exact item_note payload Bench validates", () => {
  assert.deepEqual(itemNote("abcdef0123", "  Asked 3 contractors  ", now, ID),
    { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "item_note", item: "abcdef0123", text: "Asked 3 contractors" });
  assert.equal((itemNote("abcdef0123", "x".repeat(2000), now, ID) as { text: string }).text.length, 1000);
});

test("a checklist choice carries exactly card, action and note", () => {
  assert.deepEqual(needAct("abcdef0123", "deny", "  not now  ", "0123456789ab", now, ID),
    { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "need_act", card: "abcdef0123", action: "deny", note: "not now", fp: "0123456789ab" });
  assert.equal((needAct("abcdef0123", "approve", "x".repeat(2000), "", now, ID) as { note: string }).note.length, 1000);
});

test("a TWM interview answer goes as action answer with the typed text as its note", () => {
  const p = needAct("abcdef0123", "answer", "  Yes, hide it by default  ", "", now, ID) as { action: string; note: string };
  assert.equal(p.action, "answer");
  assert.equal(p.note, "Yes, hide it by default");
});

test("mapping a worksheet carries exactly the two opaque ids", () => {
  assert.deepEqual(hsAttach("a1b2c3d4e5", "0123456789", now, ID),
    { v: 1, id: ID, created: "2026-10-28T20:00:00.000Z", kind: "hs_attach", file: "a1b2c3d4e5", entry: "0123456789" });
  assert.equal(sentKey("h", "a1b2c3d4e5"), "h:a1b2c3d4e5");
});
