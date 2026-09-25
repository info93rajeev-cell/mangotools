import { applyTheme, createPreferences, type Theme, track } from '@mangotools/runtime';
import { useEffect, useState } from 'preact/hooks';
import { IconButton } from '../primitives/Button.tsx';
import { t } from '../strings/en.ts';

const ORDER: Theme[] = ['system', 'light', 'dark'];
const ICON: Record<Theme, string> = { system: 'monitor', light: 'sun', dark: 'moon' };
const NAME: Record<Theme, string> = {
  system: t('theme.system'),
  light: t('theme.light'),
  dark: t('theme.dark'),
};

/** Cycles System → Light → Dark. The choice is stored locally and applied to <html data-theme>. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [prefs] = useState(() => createPreferences());

  useEffect(() => setTheme(prefs.getTheme()), [prefs]);

  const next = () => {
    const value = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? 'system';
    setTheme(value);
    prefs.setTheme(value);
    applyTheme(value);
    track('theme_change', { theme: value });
  };

  return (
    <IconButton
      variant="ghost"
      icon={ICON[theme]}
      label={t('theme.current', { theme: NAME[theme] })}
      onClick={next}
      data-theme-toggle=""
      data-theme-value={theme}
    />
  );
}
