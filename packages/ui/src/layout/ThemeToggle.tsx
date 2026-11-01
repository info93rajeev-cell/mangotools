import { applyTheme, createPreferences, type Theme, track } from '@mangotools/runtime';
import { useEffect, useState } from 'preact/hooks';
import { IconButton } from '../primitives/Button.tsx';
import { t } from '../strings/en.ts';

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
}

/** Toggles between Light and Dark theme with immediate visual feedback. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [prefs] = useState(() => createPreferences());

  useEffect(() => {
    const saved = prefs.getTheme();
    setTheme(saved);
  }, [prefs]);

  const effective = getEffectiveTheme(theme);
  const icon = effective === 'dark' ? 'moon' : 'sun';

  const toggle = () => {
    const nextTheme: Theme = effective === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    prefs.setTheme(nextTheme);
    applyTheme(nextTheme);
    track('theme_change', { theme: nextTheme });
  };

  return (
    <IconButton
      variant="ghost"
      icon={icon}
      label={t('theme.current', { theme: t(`theme.${effective}`) })}
      title={`Switch to ${effective === 'dark' ? 'light' : 'dark'} mode`}
      onClick={toggle}
      data-theme-toggle=""
      data-theme-value={theme}
    />
  );
}
