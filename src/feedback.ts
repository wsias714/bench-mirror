import { initFeedback } from "./lib/feedback.js";
import { dropboxRemote, isConnected } from "./lib/dropbox.ts";
import { sendToInbox } from "./lib/inbox.ts";

/** Item ids are 16 hex characters; Bench's inbox wants a uuid, so pad deterministically. A retry then
    writes the same file name and Dropbox refuses the duplicate. */
export const toUuid = (hex16: string) => {
  const h = (hex16 + "0".repeat(16)).slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

/** In-app Feedback button (shared module). The phone's only write path is inbox/<uuid>.json, so feedback goes
    there as a `feedback` payload that Bench validates (src/mirror_inbox.py) and files into the housekeeping ledger. */
export function startFeedback() {
  initFeedback({
    app: "bench-mirror",
    bottom: 76,
    upload: async (item) => {
      if (!isConnected()) throw new Error("not connected to Dropbox");
      try {
        await sendToInbox(dropboxRemote(), {
          v: 1, id: toUuid(item.id), kind: "feedback", created: item.ts, app: "bench-mirror",
          fkind: item.kind, fversion: item.version, text: item.text,
        });
      } catch (e) {
        if (!/conflict/i.test(String((e as { error?: { error_summary?: string } })?.error?.error_summary ?? e))) throw e;
      }
    },
  });
}
