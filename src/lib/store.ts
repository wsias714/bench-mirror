/* Offline cache: the last good snapshot text, so the app shows something with no signal. */
const KEY = "bm-snapshot";
export const loadCached = (): string | null => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
export const saveCached = (text: string) => {
  try {
    window.localStorage.setItem(KEY, text);
  } catch {
    /* quota or private mode: fine, it is only a cache */
  }
};
export const clearCached = () => {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
