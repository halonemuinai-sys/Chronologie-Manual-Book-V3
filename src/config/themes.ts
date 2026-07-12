// Shared color tone presets for the public Viewer page.
// Admin Dashboard uses this list to set the site-wide default;
// Viewer.tsx uses the same list to render its own theme switcher.
export const THEME_OPTIONS = [
  { id: 'gold', label: 'Emas Mewah', swatch: '#e6d8a8' },
  { id: 'ocean', label: 'Biru Elegan', swatch: '#a8c8e6' },
  { id: 'emerald', label: 'Zamrud', swatch: '#a8e6c0' },
  { id: 'rose', label: 'Rose Gold', swatch: '#e6a8c8' },
] as const;

export type ThemeId = typeof THEME_OPTIONS[number]['id'];

export const DEFAULT_THEME: ThemeId = 'gold';

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEME_OPTIONS.some(t => t.id === value);
}
