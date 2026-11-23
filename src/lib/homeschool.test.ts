import { test } from "node:test";
import assert from "node:assert/strict";
import { bar, hours, mediaGroups, pace, syncState } from "./homeschool.ts";

test("pace against a steady pace", () => {
  assert.equal(pace({ logged: 200, expected: 100, target: 300 }), "ahead");
  assert.equal(pace({ logged: 100, expected: 100, target: 300 }), "on");
  assert.equal(pace({ logged: 80, expected: 100, target: 300 }), "on");
  assert.equal(pace({ logged: 50, expected: 100, target: 300 }), "behind");
  assert.equal(pace({ logged: 30, expected: 184, target: 288 }), "far");
  assert.equal(pace({ logged: 0, expected: 0, target: 0 }), "on");
});

test("bar widths never exceed 100 and keep the planned segment inside the track", () => {
  assert.deepEqual(bar({ logged: 30, scheduled: 0, expected: 184, target: 288 }), { logged: 10, planned: 0, tick: 64 });
  const b = bar({ logged: 700, scheduled: 400, expected: 100, target: 864 });
  assert.ok(b.logged + b.planned <= 100);
  assert.deepEqual(bar({ logged: 5, scheduled: 5, expected: 5, target: 0 }).logged, 100);
});

test("hours label", () => {
  assert.equal(hours(45), "45m");
  assert.equal(hours(540), "9.0h");
});

test("sync freshness", () => {
  const now = Date.parse("2026-10-27T12:00:00Z");
  assert.deepEqual(syncState({ last_ingest_at: "2026-10-27T11:40:00Z", ok: true }, now), { kind: "ok", min: 20 });
  assert.equal(syncState({ last_ingest_at: "2026-10-27T10:20:00Z", ok: true }, now).kind, "stale");
  assert.equal(syncState({ last_ingest_at: "2026-10-27T07:00:00Z", ok: true }, now).kind, "bad");
  assert.equal(syncState({ last_ingest_at: "2026-10-27T11:59:00Z", ok: false }, now).kind, "bad");
  assert.equal(syncState(undefined, now).kind, "none");
});

test("mediaGroups splits by kind, puts items still to do first, then newest worksheet first", () => {
  const m = (kind: "book" | "movie", title: string, date: string) => ({ kind, title, creator: "", date, note: "" });
  const g = mediaGroups([m("movie", "Film B", "2026-01-02"), m("book", "Book A", ""), m("movie", "Film A", "2026-02-03"), m("book", "Book B", "2026-01-01")]);
  assert.deepEqual(g.movies.map((x) => x.title), ["Film A", "Film B"]);
  assert.deepEqual(g.books.map((x) => x.title), ["Book A", "Book B"]);
  assert.deepEqual(mediaGroups(null), { movies: [], books: [] });
});
