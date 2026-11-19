import { test } from "node:test";
import assert from "node:assert/strict";
import { AWAY_MS, startTab } from "./tabs.ts";

const tabs = ["today", "state", "deck", "twm"];
const now = Date.parse("2026-11-18T20:00:00Z");

test("first open with nothing saved is Today", () => {
  assert.equal(startTab({ tabs, saved: null, leftAt: null, seenNeeds: null, needs: 3, now }), "today");
});

test("a quick return keeps the last tab", () => {
  assert.equal(startTab({ tabs, saved: "twm", leftAt: now - 10 * 60000, seenNeeds: 3, needs: 3, now }), "twm");
});

test("away more than an hour opens on Today", () => {
  assert.equal(startTab({ tabs, saved: "twm", leftAt: now - AWAY_MS - 1, seenNeeds: 3, needs: 3, now }), "today");
});

test("more needs than last time opens on Today, even after a short break", () => {
  assert.equal(startTab({ tabs, saved: "deck", leftAt: now - 60000, seenNeeds: 2, needs: 3, now }), "today");
});

test("fewer needs keeps the last tab", () => {
  assert.equal(startTab({ tabs, saved: "deck", leftAt: now - 60000, seenNeeds: 4, needs: 3, now }), "deck");
});

test("an unknown saved tab falls back to Today", () => {
  assert.equal(startTab({ tabs, saved: "timeline", leftAt: now - 60000, seenNeeds: 3, needs: 3, now }), "today");
});

test("unknown needs (no snapshot yet) never forces Today on a quick return", () => {
  assert.equal(startTab({ tabs, saved: "state", leftAt: now - 60000, seenNeeds: 3, needs: null, now }), "state");
  assert.equal(startTab({ tabs, saved: "state", leftAt: now - 60000, seenNeeds: null, needs: 5, now }), "state");
});

test("no leave time recorded keeps the last tab unless needs went up", () => {
  assert.equal(startTab({ tabs, saved: "state", leftAt: null, seenNeeds: 1, needs: 1, now }), "state");
});
