/** Which tab the app opens on (Bench REVIEW-nav proposal 6, "open where the news is").
 * Today when the app was away more than an hour, or when the Needs count went up since he last looked;
 * otherwise the last tab he used. Pure, so it is tested without a browser. */
export const AWAY_MS = 60 * 60000;

export interface StartTabInput {
  tabs: string[];          // known tab keys, first one is Today
  saved: string | null;    // last tab used (bm-tab)
  leftAt: number | null;   // ms when the app was last hidden (bm-left)
  seenNeeds: number | null; // Needs count when the app was last hidden (bm-needs-seen)
  needs: number | null;    // Needs count now (null: no snapshot yet)
  now: number;
}

export function startTab(i: StartTabInput): string {
  const home = i.tabs[0];
  const last = i.saved && i.tabs.includes(i.saved) ? i.saved : home;
  if (last === home) return home;
  if (i.leftAt != null && i.now - i.leftAt > AWAY_MS) return home;
  if (i.needs != null && i.seenNeeds != null && i.needs > i.seenNeeds) return home;
  return last;
}
