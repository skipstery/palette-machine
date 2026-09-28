import { hexToRgb } from "./colorConversions";

// APCA-W3 constants (SA98G, version 0.0.98G-4g)
// https://github.com/Myndex/apca-w3
const APCA = {
  mainTRC: 2.4,
  sRco: 0.2126729,
  sGco: 0.7151522,
  sBco: 0.072175,
  normBG: 0.56,
  normTXT: 0.57,
  revTXT: 0.62,
  revBG: 0.65,
  blkThrs: 0.022,
  blkClmp: 1.414,
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  loBoWoffset: 0.027,
  loWoBoffset: 0.027,
  deltaYmin: 0.0005,
  loClip: 0.1,
};

// APCA uses a simple 2.4 power curve instead of the piecewise sRGB transfer function
const apcaLuminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return (
    APCA.sRco * Math.pow(r, APCA.mainTRC) +
    APCA.sGco * Math.pow(g, APCA.mainTRC) +
    APCA.sBco * Math.pow(b, APCA.mainTRC)
  );
};

// Soft clamp for near-black luminance
const clampBlack = (Y) =>
  Y > APCA.blkThrs ? Y : Y + Math.pow(APCA.blkThrs - Y, APCA.blkClmp);

/**
 * APCA lightness contrast (Lc) of text on a background.
 * Positive for dark text on light bg, negative for light text on dark bg.
 */
export const calculateAPCA = (textHex, bgHex) => {
  const Ytxt = clampBlack(apcaLuminance(textHex));
  const Ybg = clampBlack(apcaLuminance(bgHex));

  if (Math.abs(Ybg - Ytxt) < APCA.deltaYmin) return 0;

  if (Ybg > Ytxt) {
    const SAPC =
      (Math.pow(Ybg, APCA.normBG) - Math.pow(Ytxt, APCA.normTXT)) * APCA.scaleBoW;
    return SAPC < APCA.loClip ? 0 : (SAPC - APCA.loBoWoffset) * 100;
  }

  const SAPC =
    (Math.pow(Ybg, APCA.revBG) - Math.pow(Ytxt, APCA.revTXT)) * APCA.scaleWoB;
  return SAPC > -APCA.loClip ? 0 : (SAPC + APCA.loWoBoffset) * 100;
};

export const calculateWCAG = (fgHex, bgHex) => {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);

  const toLinear = (c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const Lfg =
    0.2126 * toLinear(fg.r) +
    0.7152 * toLinear(fg.g) +
    0.0722 * toLinear(fg.b);

  const Lbg =
    0.2126 * toLinear(bg.r) +
    0.7152 * toLinear(bg.g) +
    0.0722 * toLinear(bg.b);

  return (Math.max(Lfg, Lbg) + 0.05) / (Math.min(Lfg, Lbg) + 0.05);
};

export const getContrast = (colorHex, compareHex, contrastAlgo, contrastDirection) => {
  if (!colorHex || !compareHex) return 0;

  if (contrastAlgo === "APCA") {
    return contrastDirection === "text-on-bg"
      ? calculateAPCA(colorHex, compareHex)
      : calculateAPCA(compareHex, colorHex);
  }

  return calculateWCAG(colorHex, compareHex);
};

export const formatContrast = (val, contrastAlgo) =>
  contrastAlgo === "APCA"
    ? `${Math.abs(val).toFixed(0)}`
    : `${val.toFixed(1)}`;
