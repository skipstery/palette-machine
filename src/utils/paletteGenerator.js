import { oklchToColor } from "./colorConversions";

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
      const { hex, hexP3, clipped, clippedP3 } = oklchToColor(
        stop.L,
        effectiveC,
        hue.H
      );

      return {
        stop: stop.name, // Shade identifier (e.g., "500")
        L: stop.L,
        C: effectiveC,
        H: hue.H,
        oklch: `oklch(${(stop.L / 100).toFixed(3)} ${effectiveC.toFixed(3)} ${hue.H})`,
        hex,
        hexP3,
        clipped,
        clippedP3,
      };
    }),
  }));
};
