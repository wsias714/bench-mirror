import { test } from "node:test";
import assert from "node:assert/strict";
import { anchorOf, colOf, columns, counts, domainsOf, groupByWeek, select } from "./timeline.ts";
import type { TlItem } from "./snapshot.ts";

const it = (title: string, domain: string, days: number, due: string): TlItem => ({ id: title, title, domain, due, days, lead: 3 });
const ahead = [it("a", "house", 2, "2026-10-27"), it("b", "awt", 16, "2026-11-10"), it("c", "house", 20, "2026-11-14"), it("d", "zzz", 89, "2027-01-22")];
const overdue = [it("o", "nanny", -5, "2026-10-20")];

test("anchor is due minus days, columns are fortnights", () => {
  const a = anchorOf(ahead)!;
  assert.equal(a.toISOString().slice(0, 10), "2026-10-25");
  const cols = columns(a);
  assert.equal(cols.length, 6);
  assert.equal(cols[0].label, "Oct 25");
  assert.equal(cols[1].label, "Nov 9");
  assert.equal(anchorOf([]), null);
});

test("column math and counts", () => {
  assert.equal(colOf(0), 0); assert.equal(colOf(14), 0); assert.equal(colOf(15), 1); assert.equal(colOf(89), 5); assert.equal(colOf(-1), -1);
  const c = counts(ahead, overdue);
  assert.equal(c.get("house|0"), 1); assert.equal(c.get("house|1"), 1); assert.equal(c.get("awt|1"), 1); assert.equal(c.get("nanny|-1"), 1);
});

test("domains follow the desktop order, unknown last", () => {
  assert.deepEqual(domainsOf([...ahead, ...overdue]), ["awt", "nanny", "house", "zzz"]);
});

test("selection: a cell, or the next 14 days by default", () => {
  assert.deepEqual(select(ahead, overdue, { domain: "house", col: 1 }).map((x) => x.title), ["c"]);
  assert.deepEqual(select(ahead, overdue, { domain: "nanny", col: -1 }).map((x) => x.title), ["o"]);
  assert.deepEqual(select(ahead, overdue, null).map((x) => x.title), ["a"]);
});

test("week groups are labelled and sorted", () => {
  const g = groupByWeek([...overdue, ...ahead], anchorOf(ahead));
  assert.deepEqual(g.map((x) => x.label), ["Overdue", "This week", "Week of Nov 8", "Week of Jan 17"]);
});
