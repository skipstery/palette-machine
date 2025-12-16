export const DEFAULT_STOPS = [
  { name: "0", L: 100, C: 0.02 },
  { name: "50", L: 95, C: 0.05 },
  { name: "100", L: 89, C: 0.11 },
  { name: "200", L: 82, C: 0.16 },
  { name: "300", L: 76, C: 0.18 },
  { name: "400", L: 69, C: 0.19 },
  { name: "500", L: 63, C: 0.21 },
  { name: "600", L: 56, C: 0.19 },
  { name: "700", L: 50, C: 0.17 },
  { name: "800", L: 43, C: 0.14 },
  { name: "900", L: 35, C: 0.1 },
  { name: "950", L: 29, C: 0.05 },
  { name: "1000", L: 25, C: 0.02 },
];

export const DEFAULT_HUES = [
  { name: "gray", H: 0, fullGray: true },
  { name: "red", H: 23, fullGray: false },
  { name: "orange", H: 45, fullGray: false },
  { name: "amber", H: 70, fullGray: false },
  { name: "yellow", H: 95, fullGray: false },
  { name: "lime", H: 125, fullGray: false },
  { name: "green", H: 145, fullGray: false },
  { name: "emerald", H: 165, fullGray: false },
  { name: "teal", H: 180, fullGray: false },
  { name: "cyan", H: 200, fullGray: false },
  { name: "sky", H: 220, fullGray: false },
  { name: "blue", H: 255, fullGray: false },
  { name: "indigo", H: 275, fullGray: false },
  { name: "violet", H: 290, fullGray: false },
  { name: "purple", H: 305, fullGray: false },
  { name: "fuchsia", H: 325, fullGray: false },
  { name: "pink", H: 350, fullGray: false },
  { name: "rose", H: 10, fullGray: false },
];

export const DEFAULT_TOKENS = {
  primary: "blue",
  danger: "red",
  warning: "amber",
  success: "green",
  neutral: "gray",
};

export const STORAGE_KEY = "sirvui-palette-config";
export const MAX_HISTORY = 50;

export const EXPORT_INFO = {
  intents: `Intent colors provide semantic meaning to your UI:
• primary — Main brand/action color (buttons, links)
• danger — Destructive actions, errors
• warning — Caution states, alerts
• success — Positive feedback, confirmations
• neutral — Neutral/gray semantic color

Each intent maps to a primitive hue and includes all shades (0-1000) plus alpha variants.`,

  ground: `Ground colors define background surfaces at different elevation levels:
• ground — Base background (lowest elevation)
• ground1 — Raised surface (cards, modals)
• ground2 — Highest elevation (dropdowns, tooltips)

Ground colors reference primitive gray tokens via the flat palette.
In dark mode, higher elevation = lighter shade (subtle elevation cues).
You can also specify custom OKLCH values for special cases.`,

  onColors: `On-colors ensure readable text on backgrounds:
• on-ground — Text color for all ground surfaces
• on-primary, on-danger, etc. — Text on intent backgrounds

On-colors are calculated automatically (black or white) based on APCA contrast ratio against the background.`,

  stark: `Stark is the maximum contrast color against ground:
• Light mode: stark = black (#000000)
• Dark mode: stark = white (#FFFFFF)

Use stark for primary text, important icons, and high-visibility borders.
on-stark is the inverse (white on black, black on white).`,

  alphas: `Figma variables don't support opacity modifiers, so we pre-generate colors at specific alpha values.

Format: Use ranges (0-30) or individual values (35, 40, 45)
Example: "0-30,35,40,45,50,55,60,65,70-99"

Fewer alphas = smaller file, faster imports.
More alphas = finer control over transparency.`,

  exclusions: `Some token groups are for organization only and shouldn't be exported.
By default, groups starting with "#" are excluded (e.g., "# shadow").`,

  naming: `Customize token naming conventions for your design system.
Variable IDs are preserved when renaming existing tokens.`,
};

export const DEFAULT_ALPHA_CONFIG = {
  // Grounds group
  ground: "0-30,35,40,45,50,55,60,65,70-99",
  onGround: "5,10,15,20,25,30,40,50,60,70,80,90",

  // Stark group
  stark: "0-30,35,40,45,50,55,60,65,70-99",
  onStark: "5,10,15,20,25,30,40,50,60,70,80,90",

  // Black/White
  blackWhite: "5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95",

  // Semantic intents (primary, danger, warning, success, neutral)
  semanticDefault: "0-30,35,40,45,50,55,60,65,70-99",
  onSemanticDefault: "5,10,15,20,25,30,40,50,60,70,80,90",
  semanticShades: {
    0: "",
    50: "",
    100: "",
    200: "",
    300: "60",
    400: "10",
    500: "",
    600: "60",
    700: "",
    800: "5,10,15,20,30,40,50,60,70,80,85,90,95",
    900: "",
    950: "",
    1000: "",
  },
  onSemanticShades: {
    0: "",
    50: "",
    100: "",
    200: "",
    300: "",
    400: "",
    500: "",
    600: "",
    700: "",
    800: "",
    900: "",
    950: "",
    1000: "",
  },

  // Primitive intents (palette hues: blue, gray, red, etc.)
  primitiveDefault: "",
  onPrimitiveDefault: "",
  primitiveShades: {
    0: "",
    50: "",
    100: "",
    200: "",
    300: "",
    400: "",
    500: "",
    600: "",
    700: "",
    800: "",
    900: "",
    950: "",
    1000: "",
  },
  onPrimitiveShades: {
    0: "",
    50: "",
    100: "",
    200: "",
    300: "",
    400: "",
    500: "",
    600: "",
    700: "",
    800: "",
    900: "",
    950: "",
    1000: "",
  },
};
