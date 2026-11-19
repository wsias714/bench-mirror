/* What the phone writes: one new inbox/<uuid>.json per answer. Bench's inbox pass checks it against a
   strict schema (these exact fields) and applies it through its own TWM write functions. Pure helpers,
   so they are testable under node. */
import type { Remote } from "./remote.ts";

/** The only folder the phone ever writes into. */
export const INBOX_DIR = "/inbox";

export type Payload =
  | { v: 1; id: string; kind: "twm_queue"; created: string; qid: string; answer: string }
  | { v: 1; id: string; kind: "twm_queue"; created: string; qid: string; accept_default: true }
  | { v: 1; id: string; kind: "twm_feedback"; created: string; file: string; where: string; item: string; text: string }
  | { v: 1; id: string; kind: "lp_pick"; created: string; lp: string; key: string; picked: boolean }
  | { v: 1; id: string; kind: "lp_submit"; created: string; lp: string; plan_hash: string }
  | { v: 1; id: string; kind: "twm_desk"; created: string; set: string; answers: Record<string, { choice: string; note: string }> }
  | { v: 1; id: string; kind: "item_note"; created: string; item: string; text: string }
  | { v: 1; id: string; kind: "need_act"; created: string; card: string; action: "approve" | "deny"; note: string; fp: string }
  | { v: 1; id: string; kind: "feedback"; created: string; app: "bench-mirror"; fkind: "bug" | "idea" | "other"; fversion: string; text: string };

const uuid = () => (globalThis.crypto as Crypto).randomUUID();
const head = (now: Date, id: string) => ({ v: 1 as const, id, created: now.toISOString() });

export const queueAnswer = (qid: string, answer: string, now = new Date(), id = uuid()): Payload =>
  ({ ...head(now, id), kind: "twm_queue", qid, answer: answer.trim() });
export const queueAcceptDefault = (qid: string, now = new Date(), id = uuid()): Payload =>
  ({ ...head(now, id), kind: "twm_queue", qid, accept_default: true });
export const deskAnswers = (set: string, answers: Record<string, { choice: string; note: string }>, now = new Date(), id = uuid()): Payload =>
  ({ ...head(now, id), kind: "twm_desk", set, answers });

export const twmFeedback = (file: string, where: string, item: string, text: string, now = new Date(), id = uuid()): Payload =>
  ({ ...head(now, id), kind: "twm_feedback", file, where, item: item.slice(0, 200), text: text.trim() });

/** Marks one "On your desk" item done: the same Done comment the desktop button files (TWM's COO applies it that night). */
export const deskDone = (title: string, now = new Date(), id = uuid()): Payload =>
  twmFeedback("ops/DELIVERY.md", "On your desk", title, "Done (marked from phone)", now, id);

/** A progress note on one card; `item` is the opaque card id from the snapshot. Bench caps it at 1000 characters. */
export const itemNote = (item: string, text: string, now = new Date(), id = uuid()): Payload =>
  ({ ...head(now, id), kind: "item_note", item, text: text.trim().slice(0, 1000) });

/** Wade's checklist (Bench E1): approve or deny one Needs card, with an optional comment. `card` is the opaque card id
    from the snapshot; `fp` is the version of the card this screen showed, so a card that changed since is refused
    with its new text instead of guessed. Bench applies it through the same code as the desktop buttons. */
export const needAct = (card: string, action: "approve" | "deny", note = "", fp = "", now = new Date(), id = uuid()): Payload =>
  ({ ...head(now, id), kind: "need_act", card, action, note: note.trim().slice(0, 1000), fp });

export const lpPick = (lp: string, key: string, picked: boolean, now = new Date(), id = uuid()): Payload =>
  ({ ...head(now, id), kind: "lp_pick", lp, key, picked });
export const lpSubmit = (lp: string, plan_hash: string, now = new Date(), id = uuid()): Payload =>
  ({ ...head(now, id), kind: "lp_submit", lp, plan_hash });

/** Create-only upload of one payload. Resolves to the file path it wrote. */
export async function sendToInbox(remote: Remote, p: Payload): Promise<string> {
  const path = `${INBOX_DIR}/${p.id}.json`;
  await remote.create(path, JSON.stringify(p));
  return path;
}

/** "Sent, waiting for Bench": remembered per item for a few hours, so a rejected answer can be tried again. */
export const SENT_TTL_MS = 3 * 3600 * 1000;
export type Sent = Record<string, number>;
export const sentKey = (kind: "q" | "d" | "p" | "s", id: string, qid = "") => `${kind}:${id}${qid ? `:${qid}` : ""}`;
export const isWaiting = (sent: Sent, key: string, now = Date.now()) => now - (sent[key] ?? 0) < SENT_TTL_MS;
export const pruneSent = (sent: Sent, now = Date.now()): Sent =>
  Object.fromEntries(Object.entries(sent).filter(([, t]) => now - t < SENT_TTL_MS));
