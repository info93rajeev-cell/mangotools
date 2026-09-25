export type Theme = 'light' | 'dark' | 'system';

/** The subset of Web Storage used here. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const THEME_KEY = 'mt.theme';
export const RECENT_KEY = 'mt.recent';
export const MAX_RECENT = 6;

const THEMES: readonly Theme[] = ['light', 'dark', 'system'];
const TOOL_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** localStorage when it works (it can throw in private modes or when blocked), otherwise null. */
export function browserStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage;
    const probe = '__mt_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** Preferences backed by storage, falling back to memory so the page never breaks. */
export function createPreferences(storage: StorageLike | null = browserStorage()) {
  const memory = new Map<string, string>();
  const read = (key: string): string | null => {
    try {
      return storage ? storage.getItem(key) : (memory.get(key) ?? null);
    } catch {
      return memory.get(key) ?? null;
    }
  };
  const write = (key: string, value: string) => {
    memory.set(key, value);
    try {
      storage?.setItem(key, value);
    } catch {
      // Storage full or blocked: the in-memory copy keeps this page working.
    }
  };

  const getRecentTools = (): string[] => {
    try {
      const parsed: unknown = JSON.parse(read(RECENT_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((id): id is string => typeof id === 'string' && TOOL_ID.test(id))
        .slice(0, MAX_RECENT);
    } catch {
      return [];
    }
  };

  return {
    getTheme(): Theme {
      const value = read(THEME_KEY);
      return THEMES.includes(value as Theme) ? (value as Theme) : 'system';
    },
    setTheme(theme: Theme) {
      write(THEME_KEY, theme);
    },
    getRecentTools,
    addRecentTool(id: string): string[] {
      if (!TOOL_ID.test(id)) return getRecentTools();
      const next = [id, ...getRecentTools().filter((x) => x !== id)].slice(0, MAX_RECENT);
      write(RECENT_KEY, JSON.stringify(next));
      return next;
    },
  };
}

export type Preferences = ReturnType<typeof createPreferences>;

/** Applies a theme to the root element; "system" defers to prefers-color-scheme in CSS. */
export function applyTheme(
  theme: Theme,
  root: { dataset: DOMStringMap } = document.documentElement,
): void {
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}
