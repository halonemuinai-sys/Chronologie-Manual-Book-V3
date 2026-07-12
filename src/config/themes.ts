// Shared color tone presets for the public Viewer page.
// Admin Dashboard's "Tema Viewer Publik" tab lets the admin pick one of
// these as the site-wide default; Viewer.tsx reads that choice from
// Supabase and applies it via the data-theme attribute on .app-shell.
//
// `preview` is only used to render the little mock-up swatch in the Admin
// gallery — it must be kept in sync with the matching [data-theme="..."]
// block in src/index.css, which is what actually drives the Viewer's look.
export const THEME_OPTIONS = [
  {
    id: 'gold',
    label: 'Emas Mewah',
    swatch: '#e6d8a8',
    preview: { bg: '#f8f6f2', accent: '#e6d8a8', text: '#442a07' }
  },
  {
    id: 'ocean',
    label: 'Biru Elegan',
    swatch: '#a8c8e6',
    preview: { bg: '#f7f9fb', accent: '#a8c8e6', text: '#10243e' }
  },
  {
    id: 'emerald',
    label: 'Zamrud',
    swatch: '#a8e6c0',
    preview: { bg: '#f6f8f6', accent: '#a8e6c0', text: '#0d3d24' }
  },
  {
    id: 'rose',
    label: 'Rose Gold',
    swatch: '#e6a8c8',
    preview: { bg: '#f8f6f7', accent: '#e6a8c8', text: '#4a1029' }
  },
  {
    id: 'bvlgari',
    label: 'Bvlgari',
    swatch: '#d4af37',
    preview: { bg: '#1b1b1a', accent: '#d4af37', text: '#f3ead9' }
  },
  {
    id: 'omega',
    label: 'Omega',
    swatch: '#4a6b85',
    preview: { bg: '#f5f6f8', accent: '#c7d3dc', text: '#0a1f33' }
  },
] as const;

export type ThemeId = typeof THEME_OPTIONS[number]['id'];

export const DEFAULT_THEME: ThemeId = 'gold';

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEME_OPTIONS.some(t => t.id === value);
}
