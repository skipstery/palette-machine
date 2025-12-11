import { hexToRgb } from "./colorConversions";

export const calculateAPCA = (textHex, bgHex) => {
  const txt = hexToRgb(textHex);
  const bg = hexToRgb(bgHex);

  const toLinear = (c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const Ytxt =
    0.2126729 * toLinear(txt.r) +
    0.7151522 * toLinear(txt.g) +
    0.072175 * toLinear(txt.b);

  const Ybg =
    0.2126729 * toLinear(bg.r) +
    0.7151522 * toLinear(bg.g) +
    0.072175 * toLinear(bg.b);

  if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;

  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const loClip = 0.1;

  let SAPC;
  if (Ybg > Ytxt) {
    const Sbg =
      Ybg >= blkThrs
        ? Math.pow(Ybg, 0.56)
        : Ybg + Math.pow(blkThrs - Ybg, blkClmp);
    const Stxt =
      Ytxt >= blkThrs
        ? Math.pow(Ytxt, 0.57)
        : Ytxt + Math.pow(blkThrs - Ytxt, blkClmp);
    SAPC = (Sbg - Stxt) * 1.14;
  } else {
    const Sbg =
      Ybg >= blkThrs
        ? Math.pow(Ybg, 0.65)
        : Ybg + Math.pow(blkThrs - Ybg, blkClmp);
    const Stxt =
      Ytxt >= blkThrs
        ? Math.pow(Ytxt, 0.62)
        : Ytxt + Math.pow(blkThrs - Ytxt, blkClmp);
    SAPC = (Sbg - Stxt) * 1.14;
  }

  return Math.abs(SAPC) < loClip ? 0 : SAPC * 100;
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
