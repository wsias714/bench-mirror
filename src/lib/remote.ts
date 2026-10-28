/* Tiny remote interface so the sync logic is testable without Dropbox.
   `create` is the phone's only write: a NEW file (mode "add", never autorename, never overwrite) under inbox/.
   Bench's inbox pass validates and applies it; see docs/capture-and-sync.md. */
export interface RemoteFile {
  text: string;
  rev: string;
}
export interface Remote {
  read(path: string): Promise<RemoteFile | null>;
  create(path: string, text: string): Promise<void>;
}
