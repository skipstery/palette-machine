import { useState, useCallback } from 'react';
import { DEFAULT_ALPHA_CONFIG } from '../config/constants';
import { analyzePaletteFile, analyzeSemanticFile } from '../utils/fileAnalysis';
import { alphasToString } from '../utils/helpers';
import {
  generateFigmaPalette as generateFigmaPaletteUtil,
  generateFigmaSemanticTokens as generateFigmaSemanticTokensUtil,
} from '../lib/figmaExport';

/**
 * Hook for managing Figma export configuration
 */
export function useFigmaConfig({ palette, stops, hues, reverseInDark }) {
  // Ground colors mapping
  const [figmaGroundLight, setFigmaGroundLight] = useState({
    ground: '0',
    ground1: '0',
    ground2: '0',
  });
  const [figmaGroundDark, setFigmaGroundDark] = useState({
    ground: '1000',
    ground1: '950',
    ground2: '900',
  });

  // Intent mapping
  const [figmaIntentMap, setFigmaIntentMap] = useState({
    primary: 'blue',
    danger: 'red',
    warning: 'amber',
    success: 'green',
    neutral: 'gray',
  });

  // Export settings
  const [figmaDefaultShade, setFigmaDefaultShade] = useState('500');
  const [figmaExportType, setFigmaExportType] = useState('palette');
  const [semanticPreviewMode, setSemanticPreviewMode] = useState('light');
  const [figmaColorProfile, setFigmaColorProfile] = useState('p3');

  // File uploads
  const [figmaPaletteFile, setFigmaPaletteFile] = useState(null);
  const [figmaLightFile, setFigmaLightFile] = useState(null);
  const [figmaDarkFile, setFigmaDarkFile] = useState(null);

  // Parsed file data
  const [parsedPaletteFile, setParsedPaletteFile] = useState(null);
  const [parsedLightFile, setParsedLightFile] = useState(null);
  const [parsedDarkFile, setParsedDarkFile] = useState(null);

  // Palette scopes
  const [paletteScopes, setPaletteScopes] = useState([]);

  // Alpha configuration
  const [alphaConfig, setAlphaConfig] = useState(DEFAULT_ALPHA_CONFIG);

  // Shade mapping
  const [shadeSourceMap, setShadeSourceMap] = useState({});
  const [themeShadeSourceMap, setThemeShadeSourceMap] = useState({});

  // Hue mapping
  const [hueMapping, setHueMapping] = useState({});

  // Exclusion pattern
  const [exclusionPattern, setExclusionPattern] = useState('#');

  // Naming convention
  const [namingConfig, setNamingConfig] = useState({
    elevation0: 'ground',
    elevation1: 'ground1',
    elevation2: 'ground2',
    foregroundPosition: 'prefix',
    foregroundModifier: 'on/',
    foregroundSyntax: 'on-',
    shadeGroupName: 'shade',
  });

  // On-color threshold
  const [onColorThreshold, setOnColorThreshold] = useState(75);

  // Ground custom colors
  const [groundCustomColors, setGroundCustomColors] = useState({
    light: { ground: null, ground1: null, ground2: null },
    dark: { ground: null, ground1: null, ground2: null },
  });

  // Ground reference type
  const [groundRefType, setGroundRefType] = useState({
    light: { ground: 'primitive', ground1: 'primitive', ground2: 'primitive' },
    dark: { ground: 'primitive', ground1: 'primitive', ground2: 'primitive' },
  });

  // On-ground color configuration (manual selection instead of auto black/white)
  // refType: 'primitive' (palette reference), 'auto', 'black', 'white', 'custom'
  const [onGroundColor, setOnGroundColor] = useState({
    light: { refType: 'primitive', hue: 'gray', shade: '1000' },
    dark: { refType: 'primitive', hue: 'gray', shade: '0' },
  });

  // Stark shades
  const [starkShades, setStarkShades] = useState({
    light: {
      0: 'oklch(100% 0 0)',
      50: 'oklch(97% 0 0)',
      100: 'oklch(93% 0 0)',
      200: 'oklch(85% 0 0)',
      300: 'oklch(73% 0 0)',
      400: 'oklch(55% 0 0)',
      500: 'oklch(40% 0 0)',
      600: 'oklch(30% 0 0)',
      700: 'oklch(22% 0 0)',
      800: 'oklch(15% 0 0)',
      900: 'oklch(10% 0 0)',
      950: 'oklch(5% 0 0)',
      1000: 'oklch(0% 0 0)',
    },
    dark: {
      0: 'oklch(0% 0 0)',
      50: 'oklch(5% 0 0)',
      100: 'oklch(10% 0 0)',
      200: 'oklch(18% 0 0)',
      300: 'oklch(28% 0 0)',
      400: 'oklch(45% 0 0)',
      500: 'oklch(60% 0 0)',
      600: 'oklch(72% 0 0)',
      700: 'oklch(82% 0 0)',
      800: 'oklch(90% 0 0)',
      900: 'oklch(95% 0 0)',
      950: 'oklch(98% 0 0)',
      1000: 'oklch(100% 0 0)',
    },
  });

  // Stark default shade
  const [starkDefaultShade, setStarkDefaultShade] = useState({
    light: '1000',
    dark: '1000',
  });

  // Collapsible sections state
  const [exportSections, setExportSections] = useState({
    concepts: true,
    files: true,
    paletteScopes: false,
    paletteMapping: false,
    themeMapping: false,
    intents: false,
    ground: false,
    onColors: false,
    stark: false,
    alphas: false,
    exclusions: false,
    naming: false,
    preview: false,
  });

  // Toggle export section
  const toggleSection = useCallback((section) => {
    setExportSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Analyze semantic file with exclusion pattern
  const handleAnalyzeSemanticFile = useCallback(
    (jsonStr) => analyzeSemanticFile(jsonStr, exclusionPattern),
    [exclusionPattern]
  );

  // Handle palette file upload
  const handlePaletteFileUpload = useCallback(
    (jsonStr) => {
      setFigmaPaletteFile(jsonStr);
      const analysis = analyzePaletteFile(jsonStr);
      setParsedPaletteFile(analysis);

      // Auto-create hue mapping
      if (!analysis.error && analysis.hues) {
        const mapping = {};
        analysis.hues.forEach((existingHue) => {
          const normalized = existingHue.toLowerCase();
          const machineHue = hues.find(
            (h) =>
              h.name.toLowerCase() === normalized ||
              (normalized === 'grey' && h.name === 'gray') ||
              (normalized === 'gray' && h.name === 'grey')
          );
          mapping[existingHue] = machineHue ? machineHue.name : existingHue;
        });
        setHueMapping(mapping);
      }

      // Auto-create shade source map
      if (!analysis.error && analysis.shades) {
        const fileShades = new Set(analysis.shades);
        const sourceMap = {};
        stops.forEach((stop) => {
          sourceMap[stop.name] = fileShades.has(stop.name) ? stop.name : 'new';
        });
        setShadeSourceMap(sourceMap);
      }
    },
    [hues, stops]
  );

  // Handle light file upload
  const handleLightFileUpload = useCallback(
    (jsonStr) => {
      setFigmaLightFile(jsonStr);
      const analysis = handleAnalyzeSemanticFile(jsonStr);
      setParsedLightFile(analysis);

      // Auto-populate alpha config from file
      if (!analysis.error && analysis.alphas) {
        setAlphaConfig((prev) => {
          const updated = { ...prev };
          if (analysis.alphas.ground)
            updated.ground = alphasToString(analysis.alphas.ground);
          if (analysis.alphas.stark)
            updated.stark = alphasToString(analysis.alphas.stark);
          if (analysis.alphas.black)
            updated.blackWhite = alphasToString(analysis.alphas.black);
          if (analysis.alphas['on-stark'])
            updated.onStark = alphasToString(analysis.alphas['on-stark']);
          if (analysis.alphas['on-ground'])
            updated.onGround = alphasToString(analysis.alphas['on-ground']);
          return updated;
        });
      }

      // Auto-create theme shade source map
      if (!analysis.error) {
        const fileShades = new Set();
        analysis.intents?.forEach((intent) => {
          intent.shades?.forEach((s) => fileShades.add(s));
        });
        analysis.hues?.forEach((hue) => {
          hue.shades?.forEach((s) => fileShades.add(s));
        });

        const sourceMap = {};
        stops.forEach((stop) => {
          sourceMap[stop.name] = fileShades.has(stop.name) ? stop.name : 'new';
        });
        setThemeShadeSourceMap(sourceMap);
      }
    },
    [handleAnalyzeSemanticFile, stops]
  );

  // Handle dark file upload
  const handleDarkFileUpload = useCallback(
    (jsonStr) => {
      setFigmaDarkFile(jsonStr);
      const analysis = handleAnalyzeSemanticFile(jsonStr);
      setParsedDarkFile(analysis);
    },
    [handleAnalyzeSemanticFile]
  );

  // Generate Figma palette
  const generateFigmaPalette = useCallback(
    (existingFile = null) => {
      return generateFigmaPaletteUtil(
        {
          palette,
          figmaColorProfile,
          shadeSourceMap,
          hueMapping,
          paletteScopes,
          alphaConfig,
        },
        existingFile
      );
    },
    [palette, figmaColorProfile, shadeSourceMap, hueMapping, paletteScopes, alphaConfig]
  );

  // Generate Figma semantic tokens
  const generateFigmaSemanticTokens = useCallback(
    (mode, existingFile = null) => {
      return generateFigmaSemanticTokensUtil(
        mode,
        {
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
        },
        existingFile
      );
    },
    [
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
    ]
  );

  // Count tokens in JSON
  const countTokens = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      let count = 0;
      const countObject = (obj) => {
        Object.entries(obj).forEach(([key, value]) => {
          if (key.startsWith('$') && key !== '$root') return;
          if (value && typeof value === 'object') {
            if (value.$type === 'color' || value.$type === 'string') {
              count++;
            } else {
              countObject(value);
            }
          }
        });
      };
      countObject(data);
      return count;
    } catch (e) {
      return 0;
    }
  }, []);

  // Download file
  const downloadFigmaFile = useCallback((content, filename) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }, []);

  return {
    // Ground colors
    figmaGroundLight,
    setFigmaGroundLight,
    figmaGroundDark,
    setFigmaGroundDark,

    // Intent mapping
    figmaIntentMap,
    setFigmaIntentMap,

    // Export settings
    figmaDefaultShade,
    setFigmaDefaultShade,
    figmaExportType,
    setFigmaExportType,
    semanticPreviewMode,
    setSemanticPreviewMode,
    figmaColorProfile,
    setFigmaColorProfile,

    // File uploads
    figmaPaletteFile,
    setFigmaPaletteFile,
    figmaLightFile,
    setFigmaLightFile,
    figmaDarkFile,
    setFigmaDarkFile,

    // Parsed data
    parsedPaletteFile,
    setParsedPaletteFile,
    parsedLightFile,
    setParsedLightFile,
    parsedDarkFile,
    setParsedDarkFile,

    // Scopes
    paletteScopes,
    setPaletteScopes,

    // Alpha config
    alphaConfig,
    setAlphaConfig,

    // Mappings
    shadeSourceMap,
    setShadeSourceMap,
    themeShadeSourceMap,
    setThemeShadeSourceMap,
    hueMapping,
    setHueMapping,

    // Exclusion
    exclusionPattern,
    setExclusionPattern,

    // Naming
    namingConfig,
    setNamingConfig,

    // On-color
    onColorThreshold,
    setOnColorThreshold,

    // Ground custom
    groundCustomColors,
    setGroundCustomColors,
    groundRefType,
    setGroundRefType,

    // On-ground color
    onGroundColor,
    setOnGroundColor,

    // Stark
    starkShades,
    setStarkShades,
    starkDefaultShade,
    setStarkDefaultShade,

    // Sections
    exportSections,
    setExportSections,
    toggleSection,

    // File handlers
    handlePaletteFileUpload,
    handleLightFileUpload,
    handleDarkFileUpload,
    handleAnalyzeSemanticFile,

    // Export functions
    generateFigmaPalette,
    generateFigmaSemanticTokens,
    countTokens,
    downloadFigmaFile,
  };
}

export default useFigmaConfig;
