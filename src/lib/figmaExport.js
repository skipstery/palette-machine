/**
 * Figma Export Generators
 * Generates Figma Variables JSON for palette and semantic tokens
 */

import { parseAlphaString } from "../utils/helpers";
import { calculateAPCA } from "../utils/contrast";

/**
 * Helper to convert hex to RGB components (0-1)
 */
const hexToComponents = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

/**
 * Generate flat palette JSON for Figma Variables
 * @param {Object} options - Configuration options
 * @param {Array} options.palette - Palette array with hue sets
 * @param {string} options.figmaColorProfile - 'srgb' or 'p3'
 * @param {Object} options.shadeSourceMap - Mapping of machine shades to file shades
 * @param {Object} options.hueMapping - Mapping of file hues to machine hues
 * @param {Array} options.paletteScopes - Figma scopes for palette variables
 * @param {Object} options.alphaConfig - Alpha configuration including primitiveShades
 * @param {string|null} existingFile - Existing JSON file content for ID preservation
 * @returns {string} JSON string for Figma Variables
 */
export const generateFigmaPalette = (options, existingFile = null) => {
  const {
    palette,
    figmaColorProfile,
    shadeSourceMap,
    hueMapping,
    paletteScopes,
    alphaConfig,
  } = options;

  const existingData = existingFile ? JSON.parse(existingFile) : {};
  const result = {};
  const useP3 = figmaColorProfile === "p3";

  // Helper to get existing variable from file using shade source mapping
  // Supports migration from nested (gray/500) to flat (--gray-500) format
  const getExisting = (hueName, shadeName) => {
    // Get the source shade from the mapping
    const sourceShade = shadeSourceMap[shadeName];
    if (!sourceShade || sourceShade === "new") return null;

    // Find the existing hue name in the file that maps to this machine hue
    let fileHueName = null;
    for (const [existingHue, mappedHue] of Object.entries(hueMapping)) {
      if (mappedHue === hueName) {
        fileHueName = existingHue;
        break;
      }
    }
    if (!fileHueName) fileHueName = hueName;

    // Priority 1: Try nested format (for migration from old to new)
    // This ensures we preserve variableIds from the original nested structure
    if (existingData[fileHueName]?.[sourceShade]) {
      return existingData[fileHueName][sourceShade];
    }

    // Priority 2: Try flat format (for updating existing flat structure)
    const flatKey = `--${fileHueName}-${sourceShade}`;
    if (existingData[flatKey]) {
      return existingData[flatKey];
    }

    // Handle gray/grey rename - nested format
    if (fileHueName === "gray" && existingData["grey"]?.[sourceShade]) {
      return existingData["grey"][sourceShade];
    }
    if (fileHueName === "grey" && existingData["gray"]?.[sourceShade]) {
      return existingData["gray"][sourceShade];
    }

    // Handle gray/grey rename - flat format
    if (fileHueName === "gray" && existingData[`--grey-${sourceShade}`]) {
      return existingData[`--grey-${sourceShade}`];
    }
    if (fileHueName === "grey" && existingData[`--gray-${sourceShade}`]) {
      return existingData[`--gray-${sourceShade}`];
    }

    return null;
  };

  // Process each hue - flat structure with --hue-shade naming
  palette.forEach((hueSet) => {
    const hueName = hueSet.name;

    hueSet.colors.forEach((color) => {
      const shadeName = color.stop;
      const existing = getExisting(hueName, shadeName);
      const hexValue = useP3 ? color.hexP3 : color.hex;
      const components = hexToComponents(hexValue);

      // Flat variable name: --gray-500
      const varName = `--${hueName}-${shadeName}`;

      // Build extensions
      const extensions = {
        "com.figma.scopes": paletteScopes,
      };
      const existingVarId = existing?.$extensions?.["com.figma.variableId"];
      if (existingVarId) {
        extensions["com.figma.variableId"] = existingVarId;
      }

      result[varName] = {
        $type: "color",
        $value: {
          colorSpace: "srgb",
          components: components,
          alpha: 1,
          hex: hexValue.toUpperCase(),
        },
        $extensions: extensions,
      };

      // Add alpha variations for primitive shades if configured
      const primitiveShadeAlphas = alphaConfig.primitiveShades?.[shadeName];
      if (primitiveShadeAlphas) {
        const alphas = parseAlphaString(primitiveShadeAlphas);
        alphas.forEach((alpha) => {
          const alphaVarName = `--${hueName}-${shadeName}/${alpha}`;
          result[alphaVarName] = {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: components,
              alpha: alpha / 100,
              hex: hexValue.toUpperCase(),
            },
            $extensions: {
              "com.figma.scopes": paletteScopes,
            },
          };
        });
      }
    });
  });

  result["$extensions"] = { "com.figma.modeName": "palette" };
  return JSON.stringify(result, null, 2);
};

/**
 * Generate semantic tokens JSON for Figma Variables (light or dark mode)
 * @param {string} mode - 'light' or 'dark'
 * @param {Object} options - Configuration options
 * @param {Array} options.palette - Palette array with hue sets
 * @param {Object} options.figmaGroundLight - Light mode ground config
 * @param {Object} options.figmaGroundDark - Dark mode ground config
 * @param {Object} options.figmaIntentMap - Intent to hue mapping
 * @param {string} options.figmaDefaultShade - Default shade name
 * @param {string} options.figmaColorProfile - 'srgb' or 'p3'
 * @param {Object} options.alphaConfig - Alpha configuration
 * @param {Object} options.namingConfig - Naming configuration
 * @param {Object} options.groundCustomColors - Custom ground colors
 * @param {Object} options.groundRefType - Ground reference types
 * @param {number} options.onColorThreshold - Threshold for on-color calculation
 * @param {Object} options.themeShadeSourceMap - Theme shade source mapping
 * @param {Object} options.starkShades - Stark shade config per mode
 * @param {Object} options.starkDefaultShade - Default stark shade per mode
 * @param {boolean} options.reverseInDark - Whether to reverse shades in dark mode
 * @param {Array} options.stops - Stop definitions
 * @param {string|null} existingFile - Existing JSON file content for ID preservation
 * @returns {string} JSON string for Figma Variables
 */
export const generateFigmaSemanticTokens = (mode, options, existingFile = null) => {
  const {
    palette,
    figmaGroundLight,
    figmaGroundDark,
    figmaIntentMap,
    figmaDefaultShade,
    figmaColorProfile,
    alphaConfig,
    namingConfig,
    groundCustomColors,
    groundRefType,
    onGroundColor,
    onColorThreshold,
    themeShadeSourceMap,
    starkShades,
    starkDefaultShade,
    reverseInDark,
    stops,
  } = options;

  const existingData = existingFile ? JSON.parse(existingFile) : {};
  const isLight = mode === "light";
  const groundConfig = isLight ? figmaGroundLight : figmaGroundDark;
  const customColors = isLight
    ? groundCustomColors.light
    : groundCustomColors.dark;
  const useP3 = figmaColorProfile === "p3";

  // Helper to get reversed shade for dark mode (when reverseInDark is enabled)
  // Maps 0↔1000, 50↔950, 100↔900, 200↔800, 300↔700, 400↔600, 500↔500
  const getReversedShade = (shade) => {
    if (!reverseInDark || isLight) return shade;
    const shadeNames = stops.map((s) => s.name);
    const idx = shadeNames.indexOf(shade);
    if (idx === -1) return shade;
    const reversedIdx = shadeNames.length - 1 - idx;
    return shadeNames[reversedIdx];
  };

  // Parse alpha configs
  const groundAlphas = parseAlphaString(alphaConfig.ground);
  const onGroundAlphas = parseAlphaString(alphaConfig.onGround);
  const starkAlphas = parseAlphaString(alphaConfig.stark);
  const onStarkAlphas = parseAlphaString(alphaConfig.onStark);
  const semanticAlphas = parseAlphaString(alphaConfig.semanticDefault);
  const onSemanticAlphas = parseAlphaString(alphaConfig.onSemanticDefault);
  const blackWhiteAlphas = parseAlphaString(alphaConfig.blackWhite);

  // Elevation names from naming config
  const elevationNames = {
    ground: namingConfig.elevation0,
    ground1: namingConfig.elevation1,
    ground2: namingConfig.elevation2,
  };

  // Helper to parse OKLCH string to components
  const parseOklch = (oklchStr) => {
    const match = oklchStr.match(
      /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/i
    );
    if (!match) return null;
    const L = parseFloat(match[1]) / 100;
    const C = parseFloat(match[2]);
    const H = parseFloat(match[3]);
    // Convert OKLCH to sRGB (simplified - for now return gray based on L)
    // TODO: Full OKLCH to sRGB conversion
    const gray = L;
    return [gray, gray, gray];
  };

  // Helper to convert Figma path to code syntax
  // Figma path: primary/shade/500 or on/primary/shade/500/60 or on/primary/15
  // Code syntax: primary-500 or on-primary-500/60 or on-primary/15
  // Key insight: /shade/ in Figma path means next number is a shade, not alpha
  const shadeGroup = namingConfig.shadeGroupName || "shade";
  const toCodeSyntax = (figmaPath) => {
    const parts = figmaPath.split("/");
    const result = [];
    let i = 0;

    // Get the foreground modifier without trailing slash for matching
    const fgModifier = (namingConfig.foregroundModifier || "on/").replace(
      /\/$/,
      ""
    );
    const fgSyntax = namingConfig.foregroundSyntax || "on-";

    while (i < parts.length) {
      const part = parts[i];

      // Handle foreground modifier (e.g., "on" from "on/primary" → use syntax "on-")
      if (
        part === fgModifier &&
        namingConfig.foregroundPosition === "prefix"
      ) {
        // Use the syntax prefix instead of the path segment
        result.push(fgSyntax);
        i++;
        continue;
      }

      // Skip the shade group name itself
      if (part === shadeGroup && i + 1 < parts.length) {
        // Next part is a shade number - use dash
        i++;
        result.push("-" + parts[i]);
        // Check if there's an alpha after the shade
        if (i + 1 < parts.length) {
          i++;
          result.push("/" + parts[i]); // Alpha uses slash
        }
      } else if (
        /^\d+$/.test(part) &&
        parseInt(part) <= 100 &&
        result.length > 0
      ) {
        // Number not following shade group = alpha value
        result.push("/" + part);
      } else {
        // Regular path segment
        if (result.length > 0) {
          // Check if last result item is the foreground syntax prefix
          const lastItem = result[result.length - 1];
          if (lastItem === fgSyntax) {
            // Don't add another dash - the syntax already ends with it
            result.push(part);
          } else {
            result.push("-" + part);
          }
        } else {
          result.push(part);
        }
      }
      i++;
    }

    return result.join("");
  };

  // Helper to build extensions
  // codeSyntax format: color-shade for shades, color/alpha for transparency
  const makeExtensions = (
    existingVarId,
    codeSyntax,
    scopes = ["ALL_SCOPES"]
  ) => {
    const ext = {
      "com.figma.scopes": scopes,
      "com.figma.codeSyntax": { WEB: codeSyntax },
    };
    if (existingVarId) ext["com.figma.variableId"] = existingVarId;
    return ext;
  };

  // Helper to get source shade from theme mapping (for variable ID preservation)
  const getSourceShade = (machineShade) => {
    const source = themeShadeSourceMap[machineShade];
    if (!source || source === "new") return null;
    return source;
  };

  // Get palette colors by shade name
  const getPaletteColor = (hueName, shade) => {
    const hueSet = palette.find((h) => h.name === hueName);
    if (!hueSet) return { hex: "#000000", components: [0, 0, 0] };
    const color = hueSet.colors.find((c) => c.stop === shade);
    if (!color) return { hex: "#000000", components: [0, 0, 0] };
    const hexValue = useP3 ? color.hexP3 : color.hex;
    return {
      hex: hexValue.toUpperCase(),
      components: hexToComponents(hexValue),
    };
  };

  // Get ground color - either from gray palette, theme reference, or custom OKLCH
  const getGroundColor = (groundKey) => {
    const modeConfig = isLight ? groundRefType.light : groundRefType.dark;
    const refType = modeConfig[groundKey];
    const customValue = customColors[groundKey];
    const shadeValue = groundConfig[groundKey];

    // Custom OKLCH value
    if (refType === "custom" && customValue) {
      const components = parseOklch(customValue);
      if (components) {
        const toHex = (c) =>
          Math.round(Math.min(1, Math.max(0, c)) * 255)
            .toString(16)
            .padStart(2, "0");
        const hex = `#${toHex(components[0])}${toHex(components[1])}${toHex(
          components[2]
        )}`.toUpperCase();
        return { hex, components, isReference: false };
      }
    }

    // Theme reference (neutral-X) - returns alias to theme collection
    if (refType === "theme") {
      const neutralHue = figmaIntentMap.neutral || "gray";
      const paletteColor = getPaletteColor(neutralHue, shadeValue);
      return {
        hex: paletteColor.hex,
        components: paletteColor.components,
        isReference: true,
        reference: `{neutral.${shadeValue}}`,
      };
    }

    // Primitive reference (--gray-X) - returns alias to palette collection (flat naming)
    const paletteColor = getPaletteColor("gray", shadeValue);
    return {
      hex: paletteColor.hex,
      components: paletteColor.components,
      isReference: true,
      reference: `{--gray-${shadeValue}}`,
    };
  };

  // Calculate on-color (black or white) based on APCA contrast
  // Uses same logic as palette tab: calculates which foreground color (black or white)
  // provides better contrast against the background color
  const getOnColor = (bgHex) => {
    // Calculate APCA contrast for both black and white text on this background
    // APCA returns positive values when text is lighter than background (white on dark)
    // and negative values when text is darker than background (black on light)
    const contrastWithBlack = calculateAPCA("#000000", bgHex);
    const contrastWithWhite = calculateAPCA("#FFFFFF", bgHex);

    // Use whichever color provides better contrast (higher absolute value)
    // and meets the threshold if possible
    const absBlack = Math.abs(contrastWithBlack);
    const absWhite = Math.abs(contrastWithWhite);

    // Prefer the color with higher contrast
    const useBlack = absBlack >= absWhite;
    return useBlack
      ? { hex: "#000000", components: [0, 0, 0] }
      : { hex: "#FFFFFF", components: [1, 1, 1] };
  };

  const result = {};

  // Mode name
  const modeNameExt = {
    "com.figma.type": "string",
    "com.figma.scopes": ["ALL_SCOPES"],
  };
  const modeNameVarId =
    existingData.mode_name?.$extensions?.["com.figma.variableId"];
  if (modeNameVarId) modeNameExt["com.figma.variableId"] = modeNameVarId;
  result["mode_name"] = {
    $type: "string",
    $value: mode,
    $extensions: modeNameExt,
  };

  // Ground tokens using elevation names
  Object.entries(elevationNames).forEach(([groundKey, elevName]) => {
    const groundColor = getGroundColor(groundKey);
    result[elevName] = {};

    groundAlphas.forEach((alpha) => {
      const existingVarId =
        existingData[elevName]?.[alpha.toString()]?.$extensions?.[
          "com.figma.variableId"
        ];

      // If it's a theme reference with 100% alpha, use the alias
      if (groundColor.isReference && alpha === 100) {
        result[elevName][alpha.toString()] = {
          $type: "color",
          $value: groundColor.reference,
          $extensions: makeExtensions(
            existingVarId,
            `${elevName}/${alpha}`
          ),
        };
      } else {
        // Otherwise use direct color value
        result[elevName][alpha.toString()] = {
          $type: "color",
          $value: {
            colorSpace: "srgb",
            components: groundColor.components,
            alpha: alpha / 100,
            hex: groundColor.hex,
          },
          $extensions: makeExtensions(
            existingVarId,
            `${elevName}/${alpha}`
          ),
        };
      }
    });

    // Root alias using $root pattern (creates "ground" not "ground/ground")
    // Use direct color value (100% alpha) or theme reference - don't reference ground/100 which might not exist
    const existingRootVarId =
      existingData[elevName]?.$extensions?.["com.figma.variableId"] ||
      existingData[elevName]?.["$root"]?.$extensions?.[
        "com.figma.variableId"
      ];

    const rootValue = groundColor.isReference
      ? groundColor.reference // Theme reference (e.g., {neutral.500})
      : {
          colorSpace: "srgb",
          components: groundColor.components,
          alpha: 1,
          hex: groundColor.hex,
        };

    result[elevName]["$root"] = {
      $type: "color",
      $value: rootValue,
      $extensions: makeExtensions(existingRootVarId, elevName),
    };
  });

  // On-ground token (single foreground color for all elevations)
  const onPrefix = namingConfig.foregroundModifier || "on/";
  const isOnNested = onPrefix.endsWith("/");
  const onGroupName = isOnNested ? onPrefix.slice(0, -1) : null;

  // Initialize on group for grounds
  if (isOnNested && !result[onGroupName]) {
    result[onGroupName] = {};
  }

  const groundName = namingConfig.elevation0;
  const groundColor = getGroundColor("ground");

  // Get on-ground color based on configuration (primitive, auto, black, white, or custom)
  const modeOnGroundConfig = isLight ? onGroundColor?.light : onGroundColor?.dark;
  const getOnGroundColorValue = () => {
    const refType = modeOnGroundConfig?.refType || 'primitive';
    if (refType === 'primitive') {
      // Reference a palette primitive color (e.g., --gray-1000)
      const hueName = modeOnGroundConfig?.hue || 'gray';
      const shadeName = modeOnGroundConfig?.shade || (isLight ? '1000' : '0');
      const hueSet = palette.find(h => h.name === hueName);
      const color = hueSet?.colors.find(c => c.stop === shadeName);
      if (color) {
        const hexValue = useP3 ? color.hexP3 : color.hex;
        return {
          hex: hexValue,
          components: hexToComponents(hexValue),
          // Store reference info for alias generation
          isReference: true,
          refHue: hueName,
          refShade: shadeName,
        };
      }
    }
    if (refType === 'black') {
      return { hex: '#000000', components: [0, 0, 0] };
    }
    if (refType === 'white') {
      return { hex: '#FFFFFF', components: [1, 1, 1] };
    }
    if (refType === 'custom' && modeOnGroundConfig?.custom) {
      // Parse OKLCH custom value
      const match = modeOnGroundConfig.custom.match(
        /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/i
      );
      if (match) {
        const L = parseFloat(match[1]) / 100;
        // Simplified: use L for grayscale approximation
        const val = Math.round(L * 255);
        const hex = `#${val.toString(16).padStart(2, '0').repeat(3)}`.toUpperCase();
        return { hex, components: [L, L, L] };
      }
      // Try parsing as hex
      if (modeOnGroundConfig.custom.startsWith('#')) {
        const hex = modeOnGroundConfig.custom;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { hex: hex.toUpperCase(), components: [r, g, b] };
      }
    }
    // Default: auto - calculate from ground color using APCA contrast
    return getOnColor(groundColor.hex);
  };
  const onGroundColorValue = getOnGroundColorValue();

  // Set up on-ground in correct structure
  if (isOnNested) {
    result[onGroupName][groundName] = {};
  } else {
    result[`${onPrefix}${groundName}`] = {};
  }
  const onGroundTarget = isOnNested
    ? result[onGroupName][groundName]
    : result[`${onPrefix}${groundName}`];
  const onGroundPath = isOnNested
    ? `${onGroupName}/${groundName}`
    : `${onPrefix}${groundName}`;

  // Check both old and new paths for existing data
  const existingOnGround =
    existingData[onGroupName]?.[groundName] ||
    existingData[`on-${groundName}`] ||
    existingData[`on/${groundName}`] ||
    {};

  onGroundAlphas.forEach((alpha) => {
    const existingVarId =
      existingOnGround[alpha.toString()]?.$extensions?.[
        "com.figma.variableId"
      ];
    onGroundTarget[alpha.toString()] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components: onGroundColorValue.components,
        alpha: alpha / 100,
        hex: onGroundColorValue.hex,
      },
      $extensions: makeExtensions(
        existingVarId,
        `${onGroundPath}/${alpha}`
      ),
    };
  });

  // Stark tokens - full shade scale with alpha variations
  const parseStarkOklch = (oklchStr) => {
    const match = oklchStr.match(
      /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/i
    );
    if (!match) return { hex: "#808080", components: [0.5, 0.5, 0.5] };
    const L = parseFloat(match[1]) / 100;
    // Simplified: just use L for grayscale (proper OKLCH->sRGB would need full conversion)
    const val = Math.round(L * 255);
    const hex = `#${val
      .toString(16)
      .padStart(2, "0")
      .repeat(3)}`.toUpperCase();
    return { hex, components: [L, L, L] };
  };

  const modeStarkShades = isLight ? starkShades.light : starkShades.dark;
  const modeDefaultStarkShade = isLight
    ? starkDefaultShade.light
    : starkDefaultShade.dark;

  // Initialize stark with optional shade group
  if (shadeGroup) {
    result["stark"] = { [shadeGroup]: {} };
  } else {
    result["stark"] = {};
  }

  // Initialize on-stark
  if (isOnNested) {
    if (shadeGroup) {
      result[onGroupName]["stark"] = { [shadeGroup]: {} };
    } else {
      result[onGroupName]["stark"] = {};
    }
  } else {
    if (shadeGroup) {
      result[`${onPrefix}stark`] = { [shadeGroup]: {} };
    } else {
      result[`${onPrefix}stark`] = {};
    }
  }

  const starkShadeTarget = shadeGroup
    ? result["stark"][shadeGroup]
    : result["stark"];
  const onStarkTarget = isOnNested
    ? shadeGroup
      ? result[onGroupName]["stark"][shadeGroup]
      : result[onGroupName]["stark"]
    : shadeGroup
    ? result[`${onPrefix}stark`][shadeGroup]
    : result[`${onPrefix}stark`];
  const onStarkPath = isOnNested
    ? `${onGroupName}/stark`
    : `${onPrefix}stark`;

  // Check multiple paths for existing on-stark data
  const existingOnStark =
    existingData[onGroupName]?.stark ||
    existingData["on-stark"] ||
    existingData["on/stark"] ||
    {};

  // Generate stark shades (stark/shade/0, stark/shade/50, ..., stark/shade/1000)
  Object.entries(modeStarkShades).forEach(([shade, oklchVal]) => {
    const starkColor = parseStarkOklch(oklchVal);
    // Use sourceShade for migration
    const sourceShade = getSourceShade(shade);
    const existingStark =
      existingData.stark?.[shadeGroup]?.[sourceShade || shade] ||
      existingData.stark?.step?.[sourceShade || shade] ||
      existingData.stark?.[sourceShade || shade];
    const shadePath = shadeGroup
      ? `stark/${shadeGroup}/${shade}`
      : `stark/${shade}`;
    starkShadeTarget[shade] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components: starkColor.components,
        alpha: 1,
        hex: starkColor.hex,
      },
      $extensions: makeExtensions(
        existingStark?.$extensions?.["com.figma.variableId"],
        toCodeSyntax(shadePath)
      ),
    };
  });

  // Generate stark alpha variations (stark/50, etc.) using default shade
  const defaultStarkColor = parseStarkOklch(
    modeStarkShades[modeDefaultStarkShade] || modeStarkShades["1000"]
  );
  starkAlphas.forEach((alpha) => {
    const existingStark = existingData.stark?.[alpha.toString()];
    result["stark"][alpha.toString()] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components: defaultStarkColor.components,
        alpha: alpha / 100,
        hex: defaultStarkColor.hex,
      },
      $extensions: makeExtensions(
        existingStark?.$extensions?.["com.figma.variableId"],
        `stark/${alpha}`
      ),
    };
  });

  // Generate on-stark shades (inverted from stark)
  const onModeStarkShades = isLight ? starkShades.dark : starkShades.light;
  Object.entries(onModeStarkShades).forEach(([shade, oklchVal]) => {
    const onStarkColor = parseStarkOklch(oklchVal);
    // Use sourceShade for migration
    const sourceShade = getSourceShade(shade);
    const existingOnStarkShade =
      existingOnStark[shadeGroup]?.[sourceShade || shade] ||
      existingOnStark.step?.[sourceShade || shade] ||
      existingOnStark[sourceShade || shade];
    const onShadePath = shadeGroup
      ? `${onStarkPath}/${shadeGroup}/${shade}`
      : `${onStarkPath}/${shade}`;
    onStarkTarget[shade] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components: onStarkColor.components,
        alpha: 1,
        hex: onStarkColor.hex,
      },
      $extensions: makeExtensions(
        existingOnStarkShade?.$extensions?.["com.figma.variableId"],
        toCodeSyntax(onShadePath)
      ),
    };
  });

  // Generate on-stark alpha variations
  const defaultOnStarkColor = parseStarkOklch(
    onModeStarkShades[modeDefaultStarkShade] || onModeStarkShades["1000"]
  );
  const onStarkAlphaTarget = isOnNested
    ? result[onGroupName]["stark"]
    : result[`${onPrefix}stark`];
  onStarkAlphas.forEach((alpha) => {
    const existingOnStarkAlpha = existingOnStark[alpha.toString()];
    onStarkAlphaTarget[alpha.toString()] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components: defaultOnStarkColor.components,
        alpha: alpha / 100,
        hex: defaultOnStarkColor.hex,
      },
      $extensions: makeExtensions(
        existingOnStarkAlpha?.$extensions?.["com.figma.variableId"],
        `${onStarkPath}/${alpha}`
      ),
    };
  });

  // Stark root alias using $root pattern
  const starkDefaultPath = shadeGroup
    ? `{stark.${shadeGroup}.${modeDefaultStarkShade}}`
    : `{stark.${modeDefaultStarkShade}}`;
  const existingStarkRootId =
    existingData.stark?.$extensions?.["com.figma.variableId"] ||
    existingData.stark?.["$root"]?.$extensions?.["com.figma.variableId"];
  result["stark"]["$root"] = {
    $type: "color",
    $value: starkDefaultPath,
    $extensions: makeExtensions(existingStarkRootId, `stark`),
  };

  // Black and white utility tokens
  result["black"] = {};
  result["white"] = {};

  blackWhiteAlphas.forEach((alpha) => {
    result["black"][alpha.toString()] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components: [0, 0, 0],
        alpha: alpha / 100,
        hex: "#000000",
      },
      $extensions: makeExtensions(
        existingData.black?.[alpha.toString()]?.$extensions?.[
          "com.figma.variableId"
        ],
        `black/${alpha}`
      ),
    };
    result["white"][alpha.toString()] = {
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components: [1, 1, 1],
        alpha: alpha / 100,
        hex: "#FFFFFF",
      },
      $extensions: makeExtensions(
        existingData.white?.[alpha.toString()]?.$extensions?.[
          "com.figma.variableId"
        ],
        `white/${alpha}`
      ),
    };
  });

  // Black and white root aliases using $root pattern
  const existingBlackRootId =
    existingData.black?.$extensions?.["com.figma.variableId"] ||
    existingData.black?.["$root"]?.$extensions?.["com.figma.variableId"];
  const existingWhiteRootId =
    existingData.white?.$extensions?.["com.figma.variableId"] ||
    existingData.white?.["$root"]?.$extensions?.["com.figma.variableId"];
  result["black"]["$root"] = {
    $type: "color",
    $value: {
      colorSpace: "srgb",
      components: [0, 0, 0],
      alpha: 1,
      hex: "#000000",
    },
    $extensions: makeExtensions(existingBlackRootId, `black`),
  };
  result["white"]["$root"] = {
    $type: "color",
    $value: {
      colorSpace: "srgb",
      components: [1, 1, 1],
      alpha: 1,
      hex: "#FFFFFF",
    },
    $extensions: makeExtensions(existingWhiteRootId, `white`),
  };

  // Intent colors (primary, danger, warning, success, neutral) with shade and alpha variants
  // Note: shadeGroup, onPrefix, isOnNested, onGroupName already defined above

  // Initialize on group if using nested structure (may already exist from ground/stark)
  if (isOnNested && !result[onGroupName]) {
    result[onGroupName] = {};
  }

  Object.entries(figmaIntentMap).forEach(([intent, hueName]) => {
    // Initialize intent group with optional shade subgroup
    if (shadeGroup) {
      result[intent] = { [shadeGroup]: {} };
    } else {
      result[intent] = {};
    }

    // Initialize on-intent group
    if (isOnNested) {
      if (shadeGroup) {
        result[onGroupName][intent] = { [shadeGroup]: {} };
      } else {
        result[onGroupName][intent] = {};
      }
    } else {
      const flatOnName = `${onPrefix}${intent}`;
      if (shadeGroup) {
        result[flatOnName] = { [shadeGroup]: {} };
      } else {
        result[flatOnName] = {};
      }
    }

    // Helper to get the on-intent result object
    const getOnIntentObj = () =>
      isOnNested
        ? result[onGroupName][intent]
        : result[`${onPrefix}${intent}`];
    const getOnIntentPath = () =>
      isOnNested ? `${onGroupName}/${intent}` : `${onPrefix}${intent}`;

    // Helper to get existing data for on-intent (check both old and new paths)
    const getExistingOnIntent = () => {
      if (isOnNested) {
        return (
          existingData[onGroupName]?.[intent] ||
          existingData[`on-${intent}`] ||
          existingData[`on/${intent}`] ||
          {}
        );
      }
      return existingData[`${onPrefix}${intent}`] || {};
    };

    // Get all shades for this intent
    const hueSet = palette.find((h) => h.name === hueName);
    if (!hueSet) return;

    // Get the default shade color for on-color calculation and root alphas
    const defaultColor = hueSet.colors.find(
      (c) => c.stop === figmaDefaultShade
    );
    if (defaultColor) {
      // For dark mode reversal, get the reversed default shade's color
      const reversedDefaultShade = getReversedShade(figmaDefaultShade);
      const reversedDefaultColor =
        hueSet.colors.find((c) => c.stop === reversedDefaultShade) ||
        defaultColor;
      const defaultHex = useP3
        ? reversedDefaultColor.hexP3
        : reversedDefaultColor.hex;
      const defaultComponents = hexToComponents(defaultHex);
      const onIntentColor = getOnColor(defaultHex);
      const existingOnIntent = getExistingOnIntent();

      // Generate on-intent alphas (at on-intent root: on-primary/10)
      onSemanticAlphas.forEach((alpha) => {
        const onIntentObj = getOnIntentObj();
        onIntentObj[alpha.toString()] = {
          $type: "color",
          $value: {
            colorSpace: "srgb",
            components: onIntentColor.components,
            alpha: alpha / 100,
            hex: onIntentColor.hex,
          },
          $extensions: makeExtensions(
            existingOnIntent[alpha.toString()]?.$extensions?.[
              "com.figma.variableId"
            ],
            `${getOnIntentPath()}/${alpha}`
          ),
        };
      });

      // Generate intent root alphas (at intent root: primary/10, primary/15, etc.)
      // Uses default shade color but places alphas directly under intent for Figma autocomplete
      semanticAlphas
        .filter((a) => a !== 100)
        .forEach((alpha) => {
          // Check multiple paths for existing alpha at root level
          const existingRootAlpha =
            existingData[intent]?.[alpha.toString()] ||
            existingData[intent]?.[shadeGroup]?.[figmaDefaultShade]?.[
              alpha.toString()
            ] ||
            existingData[intent]?.[figmaDefaultShade]?.[alpha.toString()] ||
            null;

          const alphaPath = `${intent}/${alpha}`;
          result[intent][alpha.toString()] = {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: defaultComponents,
              alpha: alpha / 100,
              hex: defaultHex.toUpperCase(),
            },
            $extensions: makeExtensions(
              existingRootAlpha?.$extensions?.["com.figma.variableId"],
              toCodeSyntax(alphaPath)
            ),
          };
        });
    }

    hueSet.colors.forEach((color) => {
      const shade = color.stop;

      // For dark mode reversal, get the reversed shade's color values
      const paletteShade = getReversedShade(shade);
      const reversedColor =
        hueSet.colors.find((c) => c.stop === paletteShade) || color;
      const hexValue = useP3 ? reversedColor.hexP3 : reversedColor.hex;
      const components = hexToComponents(hexValue);

      // Get target object for this shade (with or without shade group)
      const shadeTarget = shadeGroup
        ? result[intent][shadeGroup]
        : result[intent];
      const shadePath = shadeGroup
        ? `${intent}/${shadeGroup}/${shade}`
        : `${intent}/${shade}`;

      // Look up variable ID from source shade (for migration)
      const sourceShade = getSourceShade(shade);
      // Check multiple possible existing paths for migration (including $root)
      const existingShade =
        existingData[intent]?.[shadeGroup]?.[sourceShade || shade]?.[
          "$root"
        ] ||
        existingData[intent]?.[shadeGroup]?.[sourceShade || shade] ||
        existingData[intent]?.step?.[sourceShade || shade]?.["$root"] ||
        existingData[intent]?.step?.[sourceShade || shade] ||
        existingData[intent]?.[sourceShade || shade]?.["$root"] ||
        existingData[intent]?.[sourceShade || shade] ||
        null;

      // Use reversed shade for palette reference in dark mode (when reverseInDark enabled)
      shadeTarget[shade] = {
        $type: "color",
        $value: `{--${hueName}-${paletteShade}}`,
        $extensions: makeExtensions(
          existingShade?.$extensions?.["com.figma.variableId"],
          toCodeSyntax(shadePath)
        ),
      };

      // Per-shade alpha variants from semanticShades config
      const shadeAlphas = parseAlphaString(
        alphaConfig.semanticShades?.[shade] || ""
      );
      if (shadeAlphas.length > 0) {
        shadeAlphas.forEach((alpha) => {
          // Use sourceShade for migration - look up from old shade, write to new shade
          const existingAlpha =
            existingData[intent]?.[shadeGroup]?.[sourceShade || shade]?.[
              alpha.toString()
            ] ||
            existingData[intent]?.step?.[sourceShade || shade]?.[
              alpha.toString()
            ] ||
            existingData[intent]?.[sourceShade || shade]?.[
              alpha.toString()
            ] ||
            null;

          // Convert shade to object with $root if it has alphas
          if (!shadeTarget[shade] || shadeTarget[shade].$type) {
            const baseValue = shadeTarget[shade];
            shadeTarget[shade] = baseValue?.$type
              ? { $root: baseValue }
              : {};
          }
          const alphaPath = shadeGroup
            ? `${intent}/${shadeGroup}/${shade}/${alpha}`
            : `${intent}/${shade}/${alpha}`;
          shadeTarget[shade][alpha.toString()] = {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: components,
              alpha: alpha / 100,
              hex: hexValue.toUpperCase(),
            },
            $extensions: makeExtensions(
              existingAlpha?.$extensions?.["com.figma.variableId"],
              toCodeSyntax(alphaPath)
            ),
          };
        });
      }

      // Generate base on-color for this shade (on-primary-500, on-primary-0, etc.)
      const onShadeColor = getOnColor(hexValue);
      const onIntentObj = getOnIntentObj();
      const onShadeTarget = shadeGroup
        ? onIntentObj[shadeGroup]
        : onIntentObj;
      const existingOnIntent = getExistingOnIntent();

      // Look up existing on-shade variable ID
      const existingOnShade =
        existingOnIntent[shadeGroup]?.[sourceShade || shade]?.["$root"] ||
        existingOnIntent[shadeGroup]?.[sourceShade || shade] ||
        existingOnIntent.step?.[sourceShade || shade]?.["$root"] ||
        existingOnIntent.step?.[sourceShade || shade] ||
        existingOnIntent[sourceShade || shade]?.["$root"] ||
        existingOnIntent[sourceShade || shade] ||
        null;

      const onShadePath = shadeGroup
        ? `${getOnIntentPath()}/${shadeGroup}/${shade}`
        : `${getOnIntentPath()}/${shade}`;

      // Create base on-shade color
      onShadeTarget[shade] = {
        $type: "color",
        $value: {
          colorSpace: "srgb",
          components: onShadeColor.components,
          alpha: 1,
          hex: onShadeColor.hex,
        },
        $extensions: makeExtensions(
          existingOnShade?.$extensions?.["com.figma.variableId"],
          toCodeSyntax(onShadePath)
        ),
      };

      // Per-on-shade alpha variants from onSemanticShades config
      const onShadeAlphas = parseAlphaString(
        alphaConfig.onSemanticShades?.[shade] || ""
      );
      if (onShadeAlphas.length > 0) {
        onShadeAlphas.forEach((alpha) => {
          // Use sourceShade for migration
          const existingOnAlpha =
            existingOnIntent[shadeGroup]?.[sourceShade || shade]?.[
              alpha.toString()
            ] ||
            existingOnIntent.step?.[sourceShade || shade]?.[
              alpha.toString()
            ] ||
            existingOnIntent[sourceShade || shade]?.[alpha.toString()] ||
            null;

          // Convert shade to object with $root if it has alphas
          if (onShadeTarget[shade].$type) {
            const baseValue = onShadeTarget[shade];
            onShadeTarget[shade] = { $root: baseValue };
          }

          const onAlphaPath = shadeGroup
            ? `${getOnIntentPath()}/${shadeGroup}/${shade}/${alpha}`
            : `${getOnIntentPath()}/${shade}/${alpha}`;
          onShadeTarget[shade][alpha.toString()] = {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: onShadeColor.components,
              alpha: alpha / 100,
              hex: onShadeColor.hex,
            },
            $extensions: makeExtensions(
              existingOnAlpha?.$extensions?.["com.figma.variableId"],
              toCodeSyntax(onAlphaPath)
            ),
          };
        });
      }
    });

    // Default intent alias using $root pattern (creates "primary" not "primary/primary")
    const aliasPath = shadeGroup
      ? `{${intent}.${shadeGroup}.${figmaDefaultShade}}`
      : `{${intent}.${figmaDefaultShade}}`;
    const existingIntentRootId =
      existingData[intent]?.$extensions?.["com.figma.variableId"] ||
      existingData[intent]?.["$root"]?.$extensions?.[
        "com.figma.variableId"
      ];
    result[intent]["$root"] = {
      $type: "color",
      $value: aliasPath,
      $extensions: makeExtensions(existingIntentRootId, intent),
    };
  });

  // Primitive hue colors (blue, gray, red, etc.) with shade and alpha variants
  // These provide direct access to palette hues in the theme collection
  const primitiveAlphas = parseAlphaString(alphaConfig.primitiveDefault);
  const onPrimitiveAlphas = parseAlphaString(
    alphaConfig.onPrimitiveDefault
  );

  palette.forEach((hueSet) => {
    const hueName = hueSet.name;

    // Skip hues that are already mapped as intents (avoid duplicates)
    const isIntent = Object.values(figmaIntentMap).includes(hueName);
    // Actually, we want both - intent is semantic (primary), hue is raw (blue)
    // They can coexist: primary -> blue, AND blue directly

    // Initialize hue group with optional shade subgroup
    if (shadeGroup) {
      result[hueName] = { [shadeGroup]: {} };
    } else {
      result[hueName] = {};
    }

    // Initialize on-hue group
    if (isOnNested) {
      if (shadeGroup) {
        result[onGroupName][hueName] = { [shadeGroup]: {} };
      } else {
        result[onGroupName][hueName] = {};
      }
    } else {
      const flatOnName = `${onPrefix}${hueName}`;
      if (shadeGroup) {
        result[flatOnName] = { [shadeGroup]: {} };
      } else {
        result[flatOnName] = {};
      }
    }

    // Helper to get the on-hue result object
    const getOnHueObj = () =>
      isOnNested
        ? result[onGroupName][hueName]
        : result[`${onPrefix}${hueName}`];
    const getOnHuePath = () =>
      isOnNested ? `${onGroupName}/${hueName}` : `${onPrefix}${hueName}`;

    // Helper to get existing data for on-hue
    const getExistingOnHue = () => {
      if (isOnNested) {
        return (
          existingData[onGroupName]?.[hueName] ||
          existingData[`on-${hueName}`] ||
          existingData[`on/${hueName}`] ||
          {}
        );
      }
      return existingData[`${onPrefix}${hueName}`] || {};
    };

    // Get the default shade color for root alphas
    const defaultColor = hueSet.colors.find(
      (c) => c.stop === figmaDefaultShade
    );
    if (defaultColor) {
      // For dark mode reversal, get the reversed default shade's color
      const reversedDefaultShade = getReversedShade(figmaDefaultShade);
      const reversedDefaultColor =
        hueSet.colors.find((c) => c.stop === reversedDefaultShade) ||
        defaultColor;
      const defaultHex = useP3
        ? reversedDefaultColor.hexP3
        : reversedDefaultColor.hex;
      const defaultComponents = hexToComponents(defaultHex);
      const onHueColor = getOnColor(defaultHex);
      const existingOnHue = getExistingOnHue();

      // Generate on-hue root alphas (at on-hue root: on-blue/10)
      onPrimitiveAlphas.forEach((alpha) => {
        const onHueObj = getOnHueObj();
        onHueObj[alpha.toString()] = {
          $type: "color",
          $value: {
            colorSpace: "srgb",
            components: onHueColor.components,
            alpha: alpha / 100,
            hex: onHueColor.hex,
          },
          $extensions: makeExtensions(
            existingOnHue[alpha.toString()]?.$extensions?.[
              "com.figma.variableId"
            ],
            toCodeSyntax(`${getOnHuePath()}/${alpha}`)
          ),
        };
      });

      // Generate hue root alphas (at hue root: blue/10, blue/15, etc.)
      primitiveAlphas
        .filter((a) => a !== 100)
        .forEach((alpha) => {
          const existingRootAlpha =
            existingData[hueName]?.[alpha.toString()] ||
            existingData[hueName]?.[shadeGroup]?.[figmaDefaultShade]?.[
              alpha.toString()
            ] ||
            null;

          const alphaPath = `${hueName}/${alpha}`;
          result[hueName][alpha.toString()] = {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: defaultComponents,
              alpha: alpha / 100,
              hex: defaultHex.toUpperCase(),
            },
            $extensions: makeExtensions(
              existingRootAlpha?.$extensions?.["com.figma.variableId"],
              toCodeSyntax(alphaPath)
            ),
          };
        });
    }

    // Add shade references and per-shade alphas
    hueSet.colors.forEach((color) => {
      const shade = color.stop;

      // For dark mode reversal, get the reversed shade's color values
      const paletteShade = getReversedShade(shade);
      const reversedColor =
        hueSet.colors.find((c) => c.stop === paletteShade) || color;
      const hexValue = useP3 ? reversedColor.hexP3 : reversedColor.hex;
      const components = hexToComponents(hexValue);

      // Get target object for this shade
      const shadeTarget = shadeGroup
        ? result[hueName][shadeGroup]
        : result[hueName];
      const shadePath = shadeGroup
        ? `${hueName}/${shadeGroup}/${shade}`
        : `${hueName}/${shade}`;

      // Look up variable ID from source shade (for migration)
      const sourceShade = getSourceShade(shade);
      const existingShade =
        existingData[hueName]?.[shadeGroup]?.[sourceShade || shade]?.[
          "$root"
        ] ||
        existingData[hueName]?.[shadeGroup]?.[sourceShade || shade] ||
        existingData[hueName]?.[sourceShade || shade]?.["$root"] ||
        existingData[hueName]?.[sourceShade || shade] ||
        null;

      // Reference flat palette variable - use reversed shade in dark mode
      shadeTarget[shade] = {
        $type: "color",
        $value: `{--${hueName}-${paletteShade}}`,
        $extensions: makeExtensions(
          existingShade?.$extensions?.["com.figma.variableId"],
          toCodeSyntax(shadePath)
        ),
      };

      // Per-shade alpha variants from primitiveShades config
      const shadeAlphaConfig = alphaConfig.primitiveShades?.[shade];
      if (shadeAlphaConfig) {
        const shadeAlphas = parseAlphaString(shadeAlphaConfig);
        shadeAlphas.forEach((alpha) => {
          const existingAlpha =
            existingData[hueName]?.[shadeGroup]?.[sourceShade || shade]?.[
              alpha.toString()
            ] ||
            existingData[hueName]?.[sourceShade || shade]?.[
              alpha.toString()
            ] ||
            null;

          // Convert shade to object with $root if it has alphas
          if (!shadeTarget[shade] || shadeTarget[shade].$type) {
            const baseValue = shadeTarget[shade];
            shadeTarget[shade] = baseValue?.$type
              ? { $root: baseValue }
              : {};
          }
          const alphaPath = shadeGroup
            ? `${hueName}/${shadeGroup}/${shade}/${alpha}`
            : `${hueName}/${shade}/${alpha}`;
          shadeTarget[shade][alpha.toString()] = {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: components,
              alpha: alpha / 100,
              hex: hexValue.toUpperCase(),
            },
            $extensions: makeExtensions(
              existingAlpha?.$extensions?.["com.figma.variableId"],
              toCodeSyntax(alphaPath)
            ),
          };
        });
      }

      // Generate base on-color for this shade (on-blue-500, on-gray-0, etc.)
      const onHueColor = getOnColor(hexValue);
      const existingOnHue = getExistingOnHue();
      const onShadeTarget = shadeGroup
        ? isOnNested
          ? result[onGroupName][hueName][shadeGroup]
          : result[`${onPrefix}${hueName}`][shadeGroup]
        : isOnNested
        ? result[onGroupName][hueName]
        : result[`${onPrefix}${hueName}`];

      // Look up existing on-shade variable ID
      const existingOnShade =
        existingOnHue[shadeGroup]?.[sourceShade || shade]?.["$root"] ||
        existingOnHue[shadeGroup]?.[sourceShade || shade] ||
        existingOnHue[sourceShade || shade]?.["$root"] ||
        existingOnHue[sourceShade || shade] ||
        null;

      const onShadePath = shadeGroup
        ? `${getOnHuePath()}/${shadeGroup}/${shade}`
        : `${getOnHuePath()}/${shade}`;

      // Create base on-shade color
      onShadeTarget[shade] = {
        $type: "color",
        $value: {
          colorSpace: "srgb",
          components: onHueColor.components,
          alpha: 1,
          hex: onHueColor.hex,
        },
        $extensions: makeExtensions(
          existingOnShade?.$extensions?.["com.figma.variableId"],
          toCodeSyntax(onShadePath)
        ),
      };

      // Per-shade on-hue alpha variants from onPrimitiveShades config
      const onShadeAlphaConfig = alphaConfig.onPrimitiveShades?.[shade];
      if (onShadeAlphaConfig) {
        const onShadeAlphas = parseAlphaString(onShadeAlphaConfig);

        onShadeAlphas.forEach((alpha) => {
          const existingOnAlpha =
            existingOnHue[shadeGroup]?.[sourceShade || shade]?.[
              alpha.toString()
            ] ||
            existingOnHue[sourceShade || shade]?.[alpha.toString()] ||
            null;

          // Convert shade to object with $root if it has alphas
          if (onShadeTarget[shade].$type) {
            const baseValue = onShadeTarget[shade];
            onShadeTarget[shade] = { $root: baseValue };
          }

          const onAlphaPath = shadeGroup
            ? `${getOnHuePath()}/${shadeGroup}/${shade}/${alpha}`
            : `${getOnHuePath()}/${shade}/${alpha}`;
          onShadeTarget[shade][alpha.toString()] = {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: onHueColor.components,
              alpha: alpha / 100,
              hex: onHueColor.hex,
            },
            $extensions: makeExtensions(
              existingOnAlpha?.$extensions?.["com.figma.variableId"],
              toCodeSyntax(onAlphaPath)
            ),
          };
        });
      }
    });

    // Default hue alias using $root pattern (creates "blue" not "blue/blue")
    const hueAliasPath = shadeGroup
      ? `{${hueName}.${shadeGroup}.${figmaDefaultShade}}`
      : `{${hueName}.${figmaDefaultShade}}`;
    const existingHueRootId =
      existingData[hueName]?.$extensions?.["com.figma.variableId"] ||
      existingData[hueName]?.["$root"]?.$extensions?.[
        "com.figma.variableId"
      ];
    result[hueName]["$root"] = {
      $type: "color",
      $value: hueAliasPath,
      $extensions: makeExtensions(existingHueRootId, hueName),
    };
  });

  result["$extensions"] = { "com.figma.modeName": mode };
  return JSON.stringify(result, null, 2);
};
