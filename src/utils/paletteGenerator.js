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

/**
 * Get display colors with optional dark mode reversal
 * @param {Object} hue - Hue object with colors array
 * @param {boolean} reverseInDark - Whether to reverse colors in dark mode
 * @param {string} mode - 'light' or 'dark'
 * @returns {Array} Display colors in correct order
 */
export const getDisplayColors = (hue, reverseInDark, mode) => {
  if (!hue || !hue.colors) return [];

  if (reverseInDark && mode === "dark") {
    return [...hue.colors].reverse();
  }

  return hue.colors;
};

/**
 * Get the appropriate color value based on preview settings
 * @param {Object} color - Color object with hex, hexP3, oklch
 * @param {string} previewColorSpace - 'srgb', 'p3', or 'native'
 * @param {string} nativeColorSpace - Detected native color space
 * @param {boolean} grayscalePreview - Whether to show grayscale
 * @returns {string} Color value to display
 */
export const getDisplayColor = (
  color,
  previewColorSpace,
  nativeColorSpace,
  grayscalePreview
) => {
  let displayColor;

  if (previewColorSpace === "p3") {
    displayColor = color.hexP3;
  } else if (previewColorSpace === "native") {
    displayColor = nativeColorSpace === "p3" ? color.hexP3 : color.hex;
  } else {
    displayColor = color.hex;
  }

  if (grayscalePreview) {
    // Convert to grayscale - implemented separately to avoid circular deps
    return displayColor;
  }

  return displayColor;
};

/**
 * Calculate palette statistics
 * @param {Array} palette - Generated palette
 * @param {Function} getContrastFn - Function to calculate contrast
 * @param {number} threshold - Minimum contrast threshold
 * @returns {Object} Statistics object
 */
export const calculatePaletteStats = (palette, getContrastFn, threshold = 75) => {
  let totalColors = 0;
  let clippedColors = 0;
  let failingContrast = 0;

  palette.forEach((hue) => {
    hue.colors.forEach((color) => {
      totalColors++;
      if (color.clipped) clippedColors++;

      if (getContrastFn) {
        const contrast = getContrastFn(color.hex);
        if (Math.abs(contrast) < threshold) {
          failingContrast++;
        }
      }
    });
  });

  return {
    totalColors,
    clippedColors,
    failingContrast,
    clippedPercentage: totalColors > 0 ? (clippedColors / totalColors) * 100 : 0,
    failingPercentage: totalColors > 0 ? (failingContrast / totalColors) * 100 : 0,
  };
};

/**
 * Find a color in the palette by hue name and shade name
 * @param {Array} palette - Generated palette
 * @param {string} hueName - Hue name (e.g., 'blue')
 * @param {string} shadeName - Shade name (e.g., '500')
 * @returns {Object|null} Color object or null if not found
 */
export const findColor = (palette, hueName, shadeName) => {
  const hue = palette.find((h) => h.name === hueName);
  if (!hue) return null;

  const color = hue.colors.find((c) => c.stop === shadeName);
  return color || null;
};

/**
 * Export palette to different formats
 * @param {Array} palette - Generated palette
 * @param {string} format - 'json', 'css', 'tailwind', 'scss'
 * @returns {string} Formatted export string
 */
export const exportPalette = (palette, format = "json") => {
  switch (format) {
    case "json-srgb":
      return exportToJSON(palette, "hex");

    case "json-p3":
      return exportToJSON(palette, "hexP3");

    case "json-oklch":
      return exportToJSON(palette, "oklch");

    case "css":
      return exportToCSS(palette);

    case "tailwind":
      return exportToTailwind(palette);

    case "scss":
      return exportToSCSS(palette);

    default:
      return exportToJSON(palette, "hex");
  }
};

// Helper export functions
const exportToJSON = (palette, colorKey) => {
  const output = {};
  palette.forEach((hue) => {
    output[hue.name] = {};
    hue.colors.forEach((color) => {
      output[hue.name][color.stop] = color[colorKey];
    });
  });
  return JSON.stringify(output, null, 2);
};

const exportToCSS = (palette) => {
  let css = ":root {\n";
  palette.forEach((hue) => {
    hue.colors.forEach((color) => {
      css += `  --${hue.name}-${color.stop}: ${color.hex};\n`;
    });
  });
  css += "}";
  return css;
};

const exportToTailwind = (palette) => {
  const colors = {};
  palette.forEach((hue) => {
    colors[hue.name] = {};
    hue.colors.forEach((color) => {
      colors[hue.name][color.stop] = color.hex;
    });
  });

  return `module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 8).replace(/"([^"]+)":/g, "$1:")},
    },
  },
};`;
};

const exportToSCSS = (palette) => {
  let scss = "// Color Palette\n\n";
  palette.forEach((hue) => {
    scss += `// ${hue.name}\n`;
    hue.colors.forEach((color) => {
      scss += `$${hue.name}-${color.stop}: ${color.hex};\n`;
    });
    scss += "\n";
  });
  return scss;
};
