---
name: chronologie-manuals-landing-page
description: Context and guidelines for building a premium landing page to view watch user manuals categorized by brand (Cali, Edox, Hamilton, Yema, Maen, Frederique Constant) for the Chronologie project.
---

# Chronologie User Manuals Landing Page Developer Skill

Use this skill when the user wants to build a premium, high-end landing page at the root route (`/`) of the Chronologie Manual Book project, allowing customers to browse and view watch manuals grouped by brand.

---

## 1. Project Background & Tech Stack

This project is a static React Single Page Application (SPA) built with Vite and TypeScript, hosted on Vercel.
- **Production URL:** `https://chronologie-manual-book.vercel.app`
- **GitHub Repository:** `https://github.com/halonemuinai-sys/Chronologie-Manual-Book.git`
- **Vite Project Directory:** `D:\Private Project\QR CODE Chronologie\viewer-app`
- **Source Manuals Directory (Local):** `D:\Private Project\QR CODE Chronologie\files manual guie` (organized locally by subfolders like `EDOX`, `HAMILTON`, `YEMA`, `MAEN`, `FREDERIQUE CONSTANT`, and `Cali` files in the root).

---

## 2. File & Routing Architecture

### A. Document Mappings (`viewer-app/src/config/mapping.json`)
The script `scripts/process_manuals.js` automatically populates this mapping. It slugifies the PDF filenames into clean URL friendly strings.
Structure example:
```json
{
  "cali-2761-gmt": {
    "file": "cali-2761-gmt.pdf",
    "title": "Cali 2761 GMT"
  },
  "maen-brooklyn-36": {
    "file": "maen-brooklyn-36.pdf",
    "title": "Maen Brooklyn 36"
  }
}
```

### B. Current Routing (`viewer-app/src/App.tsx`)
- `/:slug` -> `Viewer.tsx` (React PDF Viewer in a minimal Dark Mode layout, fit-to-width).
- `/download/:slug` -> `Downloader.tsx` (Triggers an automatic direct PDF download for iOS/Android native reading).
- `/*` -> 404 Page (Fallback).

---

## 3. Implementation Plan: Brand-Based Landing Page (`/`)

### Objective
Create a landing page component at `/` that acts as an interactive portal. Users can select a watch brand and see the list of models under that brand.

### UI & Styling Guidelines (Watch-industry Premium Aesthetics)
- **Palette:** Dark luxury watch theme (Charcoal `#1A202C`, Slate `#2D3748`, Deep Black, and Gold/Champagne accents for active states and premium contrast).
- **Typography:** Premium modern sans-serif (e.g. `Outfit` or `Inter` from Google Fonts).
- **Interactions:** Subtle hover states, smooth transitions, card layouts with clean shadows, and micro-animations when switching brands.
- **Responsiveness:** Mobile-first design, as 90% of customers scan from smartphones.

### Logical Brand Classification
Since the mapping keys (slugs) or titles contain the brand names, you can dynamically group them or instruct the code to parse them:
- **Cali / Raymond Weil:** Slugs starting with `cali-`
- **Edox:** Slugs containing `edox`
- **Hamilton:** Slugs containing `hamilton` or starting with numbers (like `1000-id-`, `1001-id-`)
- **Yema:** Slugs containing `yema` or `sistem-opersional-cmm` / `vk` / `vh`
- **Maen:** Slugs containing `maen-`
- **Frederique Constant:** Slugs containing `frederique-constant`

Alternatively, update the `process_manuals.js` script to add a `"brand"` field to the `mapping.json` model if needed, but parsing the title/slug programmatically in the frontend component is the easiest and cleanest way without breaking existing pipelines.

### Model Card Actions
For each watch model, display:
1. **Model Title** (e.g., "Brooklyn 36", "PSR 74").
2. **Action 1: Baca di Browser (View Mode)** -> Links to `/[slug]`
3. **Action 2: Unduh PDF (Download Mode)** -> Links to `/download/[slug]`

---

## 4. Workflow for Updates & Deployment
After modifying the React codebase (`App.tsx`, adding the homepage component, updating styles):
1. Test the build locally:
   ```bash
   npm run build
   ```
2. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Implement brand-based manuals portal landing page"
   git push
   ```
3. Vercel will automatically deploy the changes. Verify live at `https://chronologie-manual-book.vercel.app/`.
