/**
 * File Analysis Utilities for Figma Variables JSON
 * Analyzes uploaded palette and semantic theme files
 */

/**
 * Analyze uploaded palette file (flat format: --hue-shade)
 * @param {string} jsonStr - JSON string of palette file
 * @returns {Object} Analysis result with hues, shades, colorCount, raw data, or error
 */
export const analyzePaletteFile = (jsonStr) => {
  try {
    const data = JSON.parse(jsonStr);
    const hueNames = new Set();
    const shades = new Set();
    let colorCount = 0;

    Object.keys(data).forEach((key) => {
      if (key.startsWith("$")) return;

      // Check for flat format: --hue-shade
      if (key.startsWith("--")) {
        const match = key.match(/^--([a-zA-Z]+)-(\d+)$/);
        if (match) {
          hueNames.add(match[1]); // hue name
          shades.add(match[2]); // shade number
          colorCount++;
        }
        return;
      }

      // Old nested format: hue/shade
      if (typeof data[key] === "object") {
        hueNames.add(key);
        Object.keys(data[key])
          .filter((k) => !k.startsWith("$"))
          .forEach((shade) => {
            shades.add(shade);
            colorCount++;
          });
      }
    });

    return {
      hues: [...hueNames],
      shades: [...shades].sort((a, b) => Number(a) - Number(b)),
      colorCount,
      raw: data,
    };
  } catch (e) {
    return { error: e.message };
  }
};

/**
 * Analyze uploaded semantic (light/dark) theme file
 * @param {string} jsonStr - JSON string of theme file
 * @param {string} exclusionPattern - Pattern for excluded groups (default: "#")
 * @returns {Object} Analysis result with intents, grounds, alphas, hues, excluded, or error
 */
export const analyzeSemanticFile = (jsonStr, exclusionPattern = "#") => {
  try {
    const data = JSON.parse(jsonStr);
    const result = {
      intents: [],
      grounds: [],
      alphas: {},
      hues: [],
      excluded: [],
      raw: data,
    };

    // Find all top-level keys
    Object.keys(data).forEach((key) => {
      if (key.startsWith("$")) return;
      if (key.startsWith(exclusionPattern)) {
        result.excluded.push(key);
        return;
      }

      const val = data[key];
      if (!val || typeof val !== "object") return;

      // Check if it's a ground token
      if (["ground", "ground1", "ground2"].includes(key)) {
        const alphaKeys = Object.keys(val).filter(
          (k) => !k.startsWith("$") && !isNaN(Number(k))
        );
        result.grounds.push(key);
        result.alphas[key] = alphaKeys.map(Number).sort((a, b) => a - b);
        return;
      }

      // Check for stark, black, white, neutral
      if (["stark", "black", "white", "neutral"].includes(key)) {
        const alphaKeys = Object.keys(val).filter(
          (k) => !k.startsWith("$") && !isNaN(Number(k))
        );
        result.alphas[key] = alphaKeys.map(Number).sort((a, b) => a - b);
        return;
      }

      // Check if it looks like an intent (has shade subgroup or direct alphas)
      const subKeys = Object.keys(val).filter((k) => !k.startsWith("$"));

      // IMPORTANT: Direct numbers under intent are ALPHAS (e.g., primary/3 = 3% alpha)
      // Only numbers in a `shade` subgroup are SHADES (e.g., primary/shade/100 = shade 100)
      const directAlphaKeys = subKeys.filter((k) => !isNaN(Number(k)));
      const hasDirectAlphas = directAlphaKeys.length > 0;

      // Check for shade subgroup
      const hasShadeGroup =
        subKeys.includes("shade") && typeof val.shade === "object";
      const shadeGroupKeys = hasShadeGroup
        ? Object.keys(val.shade).filter((k) => !k.startsWith("$"))
        : [];
      const shadeKeys = shadeGroupKeys.filter((k) => !isNaN(Number(k)));
      const hasShades = shadeKeys.length > 0;

      // Also check for step subgroup (legacy)
      const hasStepGroup =
        subKeys.includes("step") && typeof val.step === "object";
      const stepGroupKeys = hasStepGroup
        ? Object.keys(val.step).filter((k) => !k.startsWith("$"))
        : [];
      const stepKeys = stepGroupKeys.filter((k) => !isNaN(Number(k)));

      // Combine shade sources
      const allShadeKeys = [...new Set([...shadeKeys, ...stepKeys])];

      if (hasShades || hasDirectAlphas || stepKeys.length > 0) {
        // Collect alphas per shade (nested within shade subgroup)
        const shadeAlphas = {};
        const shadeSource = hasShadeGroup
          ? val.shade
          : hasStepGroup
          ? val.step
          : null;
        if (shadeSource) {
          allShadeKeys.forEach((shade) => {
            if (
              typeof shadeSource[shade] === "object" &&
              shadeSource[shade].$type !== "color"
            ) {
              // Has nested alphas under this shade
              const alphaKeys = Object.keys(shadeSource[shade]).filter(
                (k) => !k.startsWith("$") && !isNaN(Number(k))
              );
              shadeAlphas[shade] = alphaKeys
                .map(Number)
                .sort((a, b) => a - b);
            }
          });
        }

        // Capture direct alpha values on the intent itself
        const intentAlphas = directAlphaKeys
          .map(Number)
          .sort((a, b) => a - b);

        // Determine if this is an intent or a primitive hue
        if (
          ["primary", "danger", "warning", "success", "neutral"].includes(
            key
          )
        ) {
          result.intents.push({
            name: key,
            shades: allShadeKeys.sort((a, b) => Number(a) - Number(b)),
            alphas: shadeAlphas,
            intentAlphas: intentAlphas, // Direct alphas on the intent
          });
        } else {
          result.hues.push({
            name: key,
            shades: allShadeKeys.sort((a, b) => Number(a) - Number(b)),
            alphas: shadeAlphas,
            intentAlphas: intentAlphas,
          });
        }
      }
    });

    // Check for on-colors
    if (data.on && typeof data.on === "object") {
      Object.keys(data.on).forEach((onKey) => {
        if (!onKey.startsWith("$")) {
          const alphaKeys = Object.keys(data.on[onKey] || {}).filter(
            (k) => !k.startsWith("$") && !isNaN(Number(k))
          );
          result.alphas[`on-${onKey}`] = alphaKeys
            .map(Number)
            .sort((a, b) => a - b);
        }
      });
    }

    return result;
  } catch (e) {
    return { error: e.message };
  }
};

/**
 * Create automatic hue mapping between file hues and machine hues
 * @param {Array} fileHues - Hue names from uploaded file
 * @param {Array} machineHues - Hue objects from palette machine
 * @returns {Object} Mapping of file hue names to machine hue names
 */
export const createHueMapping = (fileHues, machineHues) => {
  const mapping = {};

  fileHues.forEach((existingHue) => {
    const normalized = existingHue.toLowerCase();
    const machineHue = machineHues.find(
      (h) =>
        h.name.toLowerCase() === normalized ||
        (normalized === "grey" && h.name === "gray") ||
        (normalized === "gray" && h.name === "grey")
    );
    mapping[existingHue] = machineHue ? machineHue.name : existingHue;
  });

  return mapping;
};

/**
 * Create automatic shade source mapping
 * @param {Array} fileShades - Shade names from uploaded file
 * @param {Array} machineStops - Stop objects from palette machine
 * @returns {Object} Mapping of machine shade names to file shade names or 'new'
 */
export const createShadeSourceMap = (fileShades, machineStops) => {
  const fileShadeSet = new Set(fileShades);
  const sourceMap = {};

  machineStops.forEach((stop) => {
    // If file has this shade, map to itself; otherwise 'new'
    sourceMap[stop.name] = fileShadeSet.has(stop.name) ? stop.name : "new";
  });

  return sourceMap;
};
