import {
  oklchToLinearRgb,
  oklchToP3,
  linearToGamma,
  isInGamut,
  clamp,
  rgbToHex,
} from "./colorConversions";

/**
 * Generate a complete color palette from hues and stops
 * @param {Array} hues - Array of hue objects with {name, H, fullGray}
 * @param {Array} stops - Array of stop objects with {name, L, C}
 * @returns {Array} Array of hue objects with generated colors
 */
export const generatePalette = (hues, stops) => {
  return hues.map((hue) => ({
    name: hue.name,
    H: hue.H,
    fullGray: hue.fullGray,
    colors: stops.map((stop) => {
      const effectiveC = hue.fullGray ? 0 : stop.C;

      // sRGB conversion
      const [rLin, gLin, bLin] = oklchToLinearRgb(stop.L, effectiveC, hue.H);
      const inSrgbGamut = isInGamut(rLin, gLin, bLin);

      const rSrgb = linearToGamma(rLin);
      const gSrgb = linearToGamma(gLin);
      const bSrgb = linearToGamma(bLin);

      const hex = rgbToHex(clamp(rSrgb), clamp(gSrgb), clamp(bSrgb));

      // P3 conversion
      const [rP3Lin, gP3Lin, bP3Lin] = oklchToP3(stop.L, effectiveC, hue.H);
      const inP3Gamut = isInGamut(rP3Lin, gP3Lin, bP3Lin);

      const hexP3 = rgbToHex(
        linearToGamma(clamp(rP3Lin)),
        linearToGamma(clamp(gP3Lin)),
        linearToGamma(clamp(bP3Lin))
      );

      return {
        stop: stop.name, // Shade identifier (e.g., "500")
        L: stop.L,
        C: effectiveC,
        H: hue.H,
        oklch: `oklch(${(stop.L / 100).toFixed(3)} ${effectiveC.toFixed(3)} ${hue.H})`,
        hex,
        hexP3,
        clipped: !inSrgbGamut,
        clippedP3: !inP3Gamut,
      };
    }),
  }));
};
