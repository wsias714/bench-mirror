/* Tiny remote interface so the sync logic is testable without Dropbox. Read-only for now.
   A later write pass-through adds `create(path, text)` (create-only, mode "add") for inbox/<id>.json,
   the same create-only pattern as a sibling app; see docs/capture-and-sync.md. */
export interface RemoteFile {
  text: string;
  rev: string;
}
export interface Remote {
  read(path: string): Promise<RemoteFile | null>;
}
