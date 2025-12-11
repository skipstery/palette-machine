# SirvUI Palette Machine

An OKLCH color palette generator for design systems with perceptually uniform colors and APCA contrast checking.

## Features

- **OKLCH Color Space** — Perceptually uniform lightness and chroma across all hues
- **APCA Contrast** — Modern accessibility contrast algorithm (also supports WCAG)
- **P3 Support** — Detects P3-capable displays and warns about out-of-gamut colors
- **Full Customization** — Adjust lightness stops, hue angles, and chroma multipliers
- **Export Formats** — JSON, CSS Variables, Tailwind config (sRGB or OKLCH)
- **Undo/Redo** — Full history with keyboard shortcuts (⌘Z / ⌘⇧Z)
- **Persistent Storage** — Config saved to localStorage
- **Import/Export** — Save and load palette configurations

## Quick Start

```bash
npm install
npm run dev
```

## Deploy to Vercel

Push to GitHub and import at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Vite projects.

## Built With

- React 18
- Vite 5
- Tailwind CSS 4
- Lucide React icons
