export const oklchToLinearRgb = (l, c, h) => {
  const L = l / 100;
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = L - 0.0894841775 * a - 1.291485548 * b;

  let l3 = l_ * l_ * l_;
  let m3 = m_ * m_ * m_;
  let s3 = s_ * s_ * s_;

  return [
    +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
};

export const linearToGamma = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

export const isInGamut = (r, g, b) =>
  r >= -0.0001 &&
  r <= 1.0001 &&
  g >= -0.0001 &&
  g <= 1.0001 &&
  b >= -0.0001 &&
  b <= 1.0001;

export const clamp = (v) => Math.max(0, Math.min(1, v));

export const oklchToP3 = (l, c, h) => {
  const L = l / 100;
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = L - 0.0894841775 * a - 1.291485548 * b;

  let l3 = l_ * l_ * l_;
  let m3 = m_ * m_ * m_;
  let s3 = s_ * s_ * s_;

  // Linear sRGB
  let rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  // Convert linear sRGB to linear P3
  let rP3Lin = 0.8224621 * rLin + 0.177538 * gLin + 0.0 * bLin;
  let gP3Lin = 0.0331942 * rLin + 0.9668058 * gLin + 0.0 * bLin;
  let bP3Lin = 0.0170826 * rLin + 0.0723974 * gLin + 0.91052 * bLin;

  return [rP3Lin, gP3Lin, bP3Lin];
};

export const rgbToHex = (r, g, b) => {
  const toHex = (n) =>
    Math.round(clamp(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? {
        r: parseInt(r[1], 16) / 255,
        g: parseInt(r[2], 16) / 255,
        b: parseInt(r[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
};

/**
 * Normalize "#rgb" / "#rrggbb" (with or without "#") to lowercase "#rrggbb".
 * Returns null for anything else.
 */
export const normalizeHex = (hex) => {
  if (typeof hex !== "string") return null;
  const m = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const digits =
    m[1].length === 3
      ? m[1]
          .split("")
          .map((d) => d + d)
          .join("")
      : m[1];
  return `#${digits.toLowerCase()}`;
};

/**
 * Parse a CSS oklch() string. Accepts "oklch(62% 0.2 250)" and "oklch(0.62 0.2 250)".
 * @returns {{L: number, C: number, H: number} | null} L in 0-100
 */
export const parseOklch = (color) => {
  if (typeof color !== "string") return null;
  const m = color.match(
    /^\s*oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)\s*$/i
  );
  if (!m) return null;
  let L = parseFloat(m[1]);
  if (m[2] !== "%" && L <= 1) L *= 100;
  return { L, C: parseFloat(m[3]), H: parseFloat(m[4]) };
};

/**
 * Convert OKLCH to gamut-clipped sRGB and Display P3 hex values.
 * @param {number} L - Lightness 0-100
 * @param {number} C - Chroma
 * @param {number} H - Hue angle in degrees
 */
export const oklchToColor = (L, C, H) => {
  const [rLin, gLin, bLin] = oklchToLinearRgb(L, C, H);
  const [rP3Lin, gP3Lin, bP3Lin] = oklchToP3(L, C, H);

  return {
    hex: rgbToHex(linearToGamma(rLin), linearToGamma(gLin), linearToGamma(bLin)),
    hexP3: rgbToHex(
      linearToGamma(clamp(rP3Lin)),
      linearToGamma(clamp(gP3Lin)),
      linearToGamma(clamp(bP3Lin))
    ),
    clipped: !isInGamut(rLin, gLin, bLin),
    clippedP3: !isInGamut(rP3Lin, gP3Lin, bP3Lin),
  };
};

/**
 * Convert a CSS color (hex or oklch()) to an sRGB hex string.
 * Unsupported formats fall back to black.
 */
export const cssColorToHex = (color) => {
  const hex = normalizeHex(color);
  if (hex) return hex;

  const oklch = parseOklch(color);
  if (oklch) return oklchToColor(oklch.L, oklch.C, oklch.H).hex;

  return "#000000";
};

export const hexToGrayscale = (hex) => {
  const rgb = hexToRgb(hex);
  // Use luminance formula for perceptual grayscale
  const gray = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  return rgbToHex(gray, gray, gray);
};
