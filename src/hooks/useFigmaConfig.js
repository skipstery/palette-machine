import { useState, useCallback } from 'react';
import { DEFAULT_ALPHA_CONFIG, DEFAULT_FIGMA_OPTIONS } from '../config/constants';
import {
  analyzePaletteFile,
  analyzeSemanticFile,
  createHueMapping,
  createShadeSourceMap,
} from '../utils/fileAnalysis';
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
  const [figmaGroundLight, setFigmaGroundLight] = useState(DEFAULT_FIGMA_OPTIONS.figmaGroundLight);
  const [figmaGroundDark, setFigmaGroundDark] = useState(DEFAULT_FIGMA_OPTIONS.figmaGroundDark);

  // Intent mapping
  const [figmaIntentMap, setFigmaIntentMap] = useState(DEFAULT_FIGMA_OPTIONS.figmaIntentMap);

  // Export settings
  const [figmaDefaultShade, setFigmaDefaultShade] = useState(DEFAULT_FIGMA_OPTIONS.figmaDefaultShade);
  const [figmaExportType, setFigmaExportType] = useState('palette');
  const [semanticPreviewMode, setSemanticPreviewMode] = useState('light');
  const [figmaColorProfile, setFigmaColorProfile] = useState(DEFAULT_FIGMA_OPTIONS.figmaColorProfile);

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
  const [namingConfig, setNamingConfig] = useState(DEFAULT_FIGMA_OPTIONS.namingConfig);

  // On-color threshold
  const [onColorThreshold, setOnColorThreshold] = useState(DEFAULT_FIGMA_OPTIONS.onColorThreshold);

  // Ground custom colors
  const [groundCustomColors, setGroundCustomColors] = useState(DEFAULT_FIGMA_OPTIONS.groundCustomColors);

  // Ground reference type
  const [groundRefType, setGroundRefType] = useState(DEFAULT_FIGMA_OPTIONS.groundRefType);

  // On-ground color configuration (manual selection instead of auto black/white)
  // refType: 'primitive' (palette reference), 'auto', 'black', 'white', 'custom'
  const [onGroundColor, setOnGroundColor] = useState(DEFAULT_FIGMA_OPTIONS.onGroundColor);

  // Stark shades
  const [starkShades, setStarkShades] = useState(DEFAULT_FIGMA_OPTIONS.starkShades);

  // Stark default shade
  const [starkDefaultShade, setStarkDefaultShade] = useState(DEFAULT_FIGMA_OPTIONS.starkDefaultShade);

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
      const analysis = analyzePaletteFile(jsonStr);
      // Only keep files that parsed, so generators never see invalid JSON
      setFigmaPaletteFile(analysis.error ? null : jsonStr);
      setParsedPaletteFile(analysis);
      if (analysis.error) return;

      setHueMapping(createHueMapping(analysis.hues, hues));
      setShadeSourceMap(createShadeSourceMap(analysis.shades, stops));
    },
    [hues, stops]
  );

  // Handle light file upload
  const handleLightFileUpload = useCallback(
    (jsonStr) => {
      const analysis = handleAnalyzeSemanticFile(jsonStr);
      setFigmaLightFile(analysis.error ? null : jsonStr);
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

        setThemeShadeSourceMap(createShadeSourceMap([...fileShades], stops));
      }
    },
    [handleAnalyzeSemanticFile, stops]
  );

  // Handle dark file upload
  const handleDarkFileUpload = useCallback(
    (jsonStr) => {
      const analysis = handleAnalyzeSemanticFile(jsonStr);
      setFigmaDarkFile(analysis.error ? null : jsonStr);
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
    } catch {
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
