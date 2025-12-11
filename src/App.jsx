import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Copy,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Monitor,
  AlertTriangle,
  RotateCcw,
  Undo2,
  Redo2,
  Eye,
  Sun,
  Moon,
  Download,
  RefreshCw,
} from "lucide-react";

// ✅ Refactored: Imported constants and configuration
import {
  DEFAULT_STOPS,
  DEFAULT_HUES,
  DEFAULT_TOKENS,
  STORAGE_KEY,
  MAX_HISTORY,
  EXPORT_INFO,
  DEFAULT_ALPHA_CONFIG,
} from "./config/constants";

// ✅ Refactored: Imported UI components
import {
  InfoBlock,
  ConfigSection,
  FormattedDescription,
} from "./components/UI";

// ✅ Refactored: Imported helper utilities
import {
  parseAlphaString,
  alphasToString,
  copyToClipboard as copyToClipboardUtil,
  downloadFile as downloadFileUtil,
  countTokens,
} from "./utils/helpers";

// ✅ Refactored: Imported file analysis utilities
import {
  analyzePaletteFile,
  analyzeSemanticFile,
  createHueMapping,
  createShadeSourceMap,
} from "./utils/fileAnalysis";

// ✅ Refactored: Imported export generators
import { generateExport } from "./lib/exportGenerators";

// ✅ Refactored: Imported color conversion utilities
import {
  oklchToLinearRgb,
  oklchToP3,
  linearToGamma,
  isInGamut,
  clamp,
  rgbToHex,
  hexToRgb,
  cssColorToHex,
  hexToGrayscale,
} from "./utils/colorConversions";

// ✅ Refactored: Imported contrast utilities
import {
  getContrast as getContrastUtil,
  formatContrast as formatContrastUtil,
} from "./utils/contrast";

const OKLCHPalette = () => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [exportFormat, setExportFormat] = useState("json-srgb");
  const [activeTab, setActiveTab] = useState("palette");
  const [nativeColorSpace, setNativeColorSpace] = useState("srgb");
  const [previewColorSpace, setPreviewColorSpace] = useState("native");
  const [grayscalePreview, setGrayscalePreview] = useState(false);

  const [mode, setMode] = useState("light");
  const [bgColorLight, setBgColorLight] = useState("oklch(100% 0 0)"); // gray-0
  const [bgColorDark, setBgColorDark] = useState("oklch(25% 0 0)"); // gray-1000
  const [reverseInDark, setReverseInDark] = useState(true);
  const [swatchSize, setSwatchSize] = useState(72);

  const [showOKLCH, setShowOKLCH] = useState(false);
  const [showSRGB, setShowSRGB] = useState(true);
  const [showP3, setShowP3] = useState(false);
  const [showGamutWarn, setShowGamutWarn] = useState(true);
  const [swatchTextMode, setSwatchTextMode] = useState("auto"); // 'auto', 'shade', 'custom', 'fluent', 'body', 'large', 'spot'
  const [swatchTextShade, setSwatchTextShade] = useState("950");
  const [swatchTextCustom, setSwatchTextCustom] = useState("#ffffff");
  const [swatchTextAutoThreshold, setSwatchTextAutoThreshold] = useState(55); // L value at which to switch

  const [contrastAlgo, setContrastAlgo] = useState("APCA");
  const [contrastDirection, setContrastDirection] = useState("text-on-bg");
  const [showVsWhite, setShowVsWhite] = useState(false);
  const [vsWhiteColor, setVsWhiteColor] = useState("#ffffff");
  const [showVsBlack, setShowVsBlack] = useState(false);
  const [vsBlackColor, setVsBlackColor] = useState("#000000");
  const [showVsBg, setShowVsBg] = useState(true); // default vs Background
  const [showVsShade, setShowVsShade] = useState(false);
  const [contrastShade, setContrastShade] = useState("500");
  const [contrastThreshold, setContrastThreshold] = useState(75); // default 75+

  const [themeOpen, setThemeOpen] = useState(true);
  const [colorModelOpen, setColorModelOpen] = useState(true);
  const [contrastOpen, setContrastOpen] = useState(true);

  const [stops, setStops] = useState(() =>
    JSON.parse(JSON.stringify(DEFAULT_STOPS))
  );
  const [hues, setHues] = useState(() =>
    JSON.parse(JSON.stringify(DEFAULT_HUES))
  );
  const [tokens, setTokens] = useState(() =>
    JSON.parse(JSON.stringify(DEFAULT_TOKENS))
  );

  // JSON editor state
  const [jsonEditValue, setJsonEditValue] = useState("");
  const [jsonError, setJsonError] = useState(null);

  // Figma export state
  const [figmaGroundLight, setFigmaGroundLight] = useState({
    ground: "0",
    ground1: "0",
    ground2: "0",
  });
  const [figmaGroundDark, setFigmaGroundDark] = useState({
    ground: "1000",
    ground1: "950",
    ground2: "900",
  });
  const [figmaIntentMap, setFigmaIntentMap] = useState({
    primary: "blue",
    danger: "red",
    warning: "amber",
    success: "green",
    neutral: "gray",
  });
  const [figmaDefaultShade, setFigmaDefaultShade] = useState("500");
  const [figmaPaletteFile, setFigmaPaletteFile] = useState(null);
  const [figmaLightFile, setFigmaLightFile] = useState(null);
  const [figmaDarkFile, setFigmaDarkFile] = useState(null);
  const [figmaExportType, setFigmaExportType] = useState("palette"); // 'palette' or 'semantic'
  const [semanticPreviewMode, setSemanticPreviewMode] = useState("light"); // for preview toggle
  const [figmaColorProfile, setFigmaColorProfile] = useState("p3"); // 'srgb' or 'p3'

  // Palette variable scopes - restrict where primitives can be used
  // Available scopes: ALL_SCOPES, ALL_FILLS, FRAME_FILL, SHAPE_FILL, TEXT_FILL, STROKE_COLOR, EFFECT_COLOR
  const [paletteScopes, setPaletteScopes] = useState([]); // Empty = hidden from all direct use

  // Parsed file data for display
  const [parsedPaletteFile, setParsedPaletteFile] = useState(null);
  const [parsedLightFile, setParsedLightFile] = useState(null);
  const [parsedDarkFile, setParsedDarkFile] = useState(null);

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

  // Alpha configuration
  const [alphaConfig, setAlphaConfig] = useState(DEFAULT_ALPHA_CONFIG);

  // Shade remapping
  // Shade source mapping: for each machine shade, where does the Figma variable come from?
  // Key: machine shade, Value: file shade or 'new'
  const [shadeSourceMap, setShadeSourceMap] = useState({});

  // Theme shade source mapping: for semantic tokens shade migration
  // Key: target shade, Value: source shade from existing theme file or 'new'
  const [themeShadeSourceMap, setThemeShadeSourceMap] = useState({});

  // Hue mapping (existing name → machine name)
  const [hueMapping, setHueMapping] = useState({});

  // Exclusion pattern
  const [exclusionPattern, setExclusionPattern] = useState("#");

  // Naming convention
  const [namingConfig, setNamingConfig] = useState({
    elevation0: "ground",
    elevation1: "ground1",
    elevation2: "ground2",
    foregroundPosition: "prefix", // 'prefix' or 'suffix'
    foregroundModifier: "on/", // Creates on/primary structure in Figma path
    foregroundSyntax: "on-", // Creates on-primary in code syntax (CSS/Tailwind)
    shadeGroupName: "shade", // Creates primary/shade/500 structure (empty = flat)
  });

  // On-color contrast threshold
  const [onColorThreshold, setOnColorThreshold] = useState(75);

  // Ground color custom values (null = use gray shade, string = custom OKLCH)
  const [groundCustomColors, setGroundCustomColors] = useState({
    light: { ground: null, ground1: null, ground2: null },
    dark: { ground: null, ground1: null, ground2: null },
  });

  // Ground color reference type: 'primitive' (gray-X), 'theme' (neutral-X), or 'custom' (OKLCH)
  const [groundRefType, setGroundRefType] = useState({
    light: { ground: "primitive", ground1: "primitive", ground2: "primitive" },
    dark: { ground: "primitive", ground1: "primitive", ground2: "primitive" },
  });

  // Stark shade scale (OKLCH values for each shade in both themes)
  // Stark is typically used for maximum contrast text/UI - needs manual control
  // because stark palettes have unique generation patterns and theme reversal
  const [starkShades, setStarkShades] = useState({
    light: {
      0: "oklch(100% 0 0)",
      50: "oklch(97% 0 0)",
      100: "oklch(93% 0 0)",
      200: "oklch(85% 0 0)",
      300: "oklch(73% 0 0)",
      400: "oklch(55% 0 0)",
      500: "oklch(40% 0 0)",
      600: "oklch(30% 0 0)",
      700: "oklch(22% 0 0)",
      800: "oklch(15% 0 0)",
      900: "oklch(10% 0 0)",
      950: "oklch(5% 0 0)",
      1000: "oklch(0% 0 0)",
    },
    dark: {
      0: "oklch(0% 0 0)",
      50: "oklch(5% 0 0)",
      100: "oklch(10% 0 0)",
      200: "oklch(18% 0 0)",
      300: "oklch(28% 0 0)",
      400: "oklch(45% 0 0)",
      500: "oklch(60% 0 0)",
      600: "oklch(72% 0 0)",
      700: "oklch(82% 0 0)",
      800: "oklch(90% 0 0)",
      900: "oklch(95% 0 0)",
      950: "oklch(98% 0 0)",
      1000: "oklch(100% 0 0)",
    },
  });

  // Default stark shade (the main "stark" token without shade suffix)
  const [starkDefaultShade, setStarkDefaultShade] = useState({
    light: "1000",
    dark: "1000",
  });

  // Helper: Parse alpha string like "0-30,35,40,45,50" into array of numbers
  const parseAlphaString = useCallback((str) => {
    if (!str || !str.trim()) return [];
    const result = [];
    const parts = str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    parts.forEach((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) result.push(i);
        }
      } else {
        const num = Number(part);
        if (!isNaN(num)) result.push(num);
      }
    });
    return [...new Set(result)].sort((a, b) => a - b);
  }, []);

  // Helper: Convert array of numbers to compact string like "0-30,35,40"
  const alphasToString = useCallback((alphas) => {
    if (!alphas || !alphas.length) return "";
    const sorted = [...new Set(alphas)].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0],
      end = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        if (start === end) ranges.push(String(start));
        else if (end === start + 1) ranges.push(`${start},${end}`);
        else ranges.push(`${start}-${end}`);
        start = end = sorted[i];
      }
    }
    return ranges.join(",");
  }, []);

  // Helper: Analyze uploaded palette file
  const analyzePaletteFile = useCallback((jsonStr) => {
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
  }, []);

  // Helper: Analyze uploaded semantic (light/dark) file
  const analyzeSemanticFile = useCallback(
    (jsonStr) => {
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
                intentAlphas: intentAlphas, // Direct alphas on the intent (e.g., primary/3, primary/5)
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
    },
    [exclusionPattern]
  );

  // Process uploaded files and update parsed state
  const handlePaletteFileUpload = useCallback(
    (jsonStr) => {
      setFigmaPaletteFile(jsonStr);
      const analysis = analyzePaletteFile(jsonStr);
      setParsedPaletteFile(analysis);

      // Auto-create hue mapping
      if (!analysis.error && analysis.hues) {
        const mapping = {};
        analysis.hues.forEach((existingHue) => {
          // Try to find matching hue in machine
          const normalized = existingHue.toLowerCase();
          const machineHue = hues.find(
            (h) =>
              h.name.toLowerCase() === normalized ||
              (normalized === "grey" && h.name === "gray") ||
              (normalized === "gray" && h.name === "grey")
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
          // If file has this shade, map to itself; otherwise 'new'
          sourceMap[stop.name] = fileShades.has(stop.name) ? stop.name : "new";
        });
        setShadeSourceMap(sourceMap);
      }
    },
    [analyzePaletteFile, hues, stops]
  );

  const handleLightFileUpload = useCallback(
    (jsonStr) => {
      setFigmaLightFile(jsonStr);
      const analysis = analyzeSemanticFile(jsonStr);
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
          if (analysis.alphas["on-stark"])
            updated.onStark = alphasToString(analysis.alphas["on-stark"]);
          if (analysis.alphas["on-ground"])
            updated.onGround = alphasToString(analysis.alphas["on-ground"]);
          return updated;
        });
      }

      // Auto-create theme shade source map from intents/hues shades
      if (!analysis.error) {
        const fileShades = new Set();
        // Collect all shades from intents
        analysis.intents?.forEach((intent) => {
          intent.shades?.forEach((s) => fileShades.add(s));
        });
        // Collect from hues too
        analysis.hues?.forEach((hue) => {
          hue.shades?.forEach((s) => fileShades.add(s));
        });

        // Map our target shades to file shades - use actual stops from palette
        const sourceMap = {};
        stops.forEach((stop) => {
          sourceMap[stop.name] = fileShades.has(stop.name) ? stop.name : "new";
        });
        setThemeShadeSourceMap(sourceMap);
      }
    },
    [analyzeSemanticFile, alphasToString, stops]
  );

  const handleDarkFileUpload = useCallback(
    (jsonStr) => {
      setFigmaDarkFile(jsonStr);
      const analysis = analyzeSemanticFile(jsonStr);
      setParsedDarkFile(analysis);
    },
    [analyzeSemanticFile]
  );

  // Toggle export section
  const toggleSection = useCallback((section) => {
    setExportSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  // Keep refs in sync
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  // Sync JSON editor when switching to JSON tab or when data changes
  useEffect(() => {
    if (activeTab === "json") {
      setJsonEditValue(
        JSON.stringify(
          { stops, hues, settings: { bgColorLight, bgColorDark, swatchSize } },
          null,
          2
        )
      );
      setJsonError(null);
    }
  }, [activeTab, stops, hues, bgColorLight, bgColorDark, swatchSize]);

  // Get current state snapshot for history
  const getStateSnapshot = useCallback(
    () => ({
      stops: JSON.parse(JSON.stringify(stops)),
      hues: JSON.parse(JSON.stringify(hues)),
      settings: { bgColorLight, bgColorDark, swatchSize },
    }),
    [stops, hues, bgColorLight, bgColorDark, swatchSize]
  );

  // Push to history
  const pushToHistory = useCallback((snapshot) => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }
    const currentIndex = historyIndexRef.current;
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(snapshot);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(currentIndex + 1);
  }, []);

  // Track changes for history
  useEffect(() => {
    const snapshot = getStateSnapshot();
    const timer = setTimeout(() => pushToHistory(snapshot), 300);
    return () => clearTimeout(timer);
  }, [
    stops,
    hues,
    bgColorLight,
    bgColorDark,
    swatchSize,
    getStateSnapshot,
    pushToHistory,
  ]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

  const undo = useCallback(() => {
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;
    if (currentIndex <= 0) return;

    isUndoRedo.current = true;
    const prevState = currentHistory[currentIndex - 1];
    if (prevState) {
      setStops(prevState.stops);
      setHues(prevState.hues);
      if (prevState.settings) {
        setBgColorLight(prevState.settings.bgColorLight);
        setBgColorDark(prevState.settings.bgColorDark);
        setSwatchSize(prevState.settings.swatchSize);
      }
      setHistoryIndex(currentIndex - 1);
    }
  }, []);

  const redo = useCallback(() => {
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;
    if (currentIndex >= currentHistory.length - 1) return;

    isUndoRedo.current = true;
    const nextState = currentHistory[currentIndex + 1];
    if (nextState) {
      setStops(nextState.stops);
      setHues(nextState.hues);
      if (nextState.settings) {
        setBgColorLight(nextState.settings.bgColorLight);
        setBgColorDark(nextState.settings.bgColorDark);
        setSwatchSize(nextState.settings.swatchSize);
      }
      setHistoryIndex(currentIndex + 1);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        if (config.stops) setStops(config.stops);
        if (config.hues) setHues(config.hues);
        if (config.tokens) setTokens(config.tokens);
        if (config.settings) {
          if (config.settings.bgColorLight)
            setBgColorLight(config.settings.bgColorLight);
          if (config.settings.bgColorDark)
            setBgColorDark(config.settings.bgColorDark);
          if (config.settings.swatchSize)
            setSwatchSize(config.settings.swatchSize);
        }
      }
    } catch (e) {
      console.warn("Failed to load config:", e);
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    const config = {
      stops,
      hues,
      settings: { bgColorLight, bgColorDark, swatchSize },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}
  }, [stops, hues, bgColorLight, bgColorDark, swatchSize]);

  // System theme detection
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mqTheme = window.matchMedia("(prefers-color-scheme: dark)");
      setMode(mqTheme.matches ? "dark" : "light");
      const handler = (e) => setMode(e.matches ? "dark" : "light");
      mqTheme.addEventListener("change", handler);
      const mqP3 = window.matchMedia("(color-gamut: p3)");
      setNativeColorSpace(mqP3.matches ? "p3" : "srgb");
      mqP3.addEventListener("change", (e) =>
        setNativeColorSpace(e.matches ? "p3" : "srgb")
      );
      return () => mqTheme.removeEventListener("change", handler);
    }
  }, []);

  const resetToDefaults = () => {
    // Clear localStorage FIRST
    localStorage.removeItem(STORAGE_KEY);

    // Reset palette data with deep copies
    setStops(JSON.parse(JSON.stringify(DEFAULT_STOPS)));
    setHues(JSON.parse(JSON.stringify(DEFAULT_HUES)));
    setTokens(JSON.parse(JSON.stringify(DEFAULT_TOKENS)));

    // Reset theme settings
    setBgColorLight("oklch(100% 0 0)");
    setBgColorDark("oklch(25% 0 0)");
    setSwatchSize(72);
    setReverseInDark(true);

    // Reset display options
    setShowOKLCH(false);
    setShowSRGB(true);
    setShowP3(false);
    setShowGamutWarn(true);
    setSwatchTextMode("auto");
    setSwatchTextShade("950");
    setSwatchTextCustom("#ffffff");
    setSwatchTextAutoThreshold(55);

    // Reset contrast settings
    setContrastAlgo("APCA");
    setContrastDirection("text-on-bg");
    setShowVsWhite(false);
    setVsWhiteColor("#ffffff");
    setShowVsBlack(false);
    setVsBlackColor("#000000");
    setShowVsBg(true);
    setShowVsShade(false);
    setContrastShade("500");
    setContrastThreshold(75);

    // Reset history
    isUndoRedo.current = true; // Prevent this from being added to history
    setHistory([]);
    setHistoryIndex(-1);
  };

  const effectiveColorSpace =
    previewColorSpace === "native" ? nativeColorSpace : previewColorSpace;
  const currentBg = mode === "light" ? bgColorLight : bgColorDark;
  const isDark = mode === "dark";
  const textColor = isDark ? "#f5f5f5" : "#171717";
  const textMuted = isDark ? "#737373" : "#a3a3a3";
  const cardBg = isDark ? "#262626" : "#ffffff";
  const inputBg = isDark ? "#333333" : "#ffffff";
  const borderColor = isDark ? "#404040" : "#e5e5e5";

  // ✅ Color conversion functions imported from utils/colorConversions
  // ✅ Contrast functions imported from utils/contrast

  // Get background color as hex for contrast calculations
  const currentBgHex = cssColorToHex(currentBg);

  // Wrapper for getContrast that uses component state (contrastAlgo, contrastDirection)
  const getContrast = (colorHex, compareHex) => {
    return getContrastUtil(colorHex, compareHex, contrastAlgo, contrastDirection);
  };

  // Wrapper for formatContrast that uses component state (contrastAlgo)
  const formatContrast = (val) => {
    return formatContrastUtil(val, contrastAlgo);
  };

  const palette = useMemo(() => {
    return hues.map((hue) => ({
      name: hue.name,
      H: hue.H,
      colors: stops.map((stop) => {
        const effectiveC = hue.fullGray ? 0 : stop.C;
        const [rLin, gLin, bLin] = oklchToLinearRgb(stop.L, effectiveC, hue.H);
        const inSrgbGamut = isInGamut(rLin, gLin, bLin);
        const rSrgb = linearToGamma(rLin),
          gSrgb = linearToGamma(gLin),
          bSrgb = linearToGamma(bLin);
        const hex = rgbToHex(clamp(rSrgb), clamp(gSrgb), clamp(bSrgb));

        // For P3, we need to check if color is in P3 gamut and convert properly
        const [rP3Lin, gP3Lin, bP3Lin] = oklchToP3(stop.L, effectiveC, hue.H);
        const inP3Gamut = isInGamut(rP3Lin, gP3Lin, bP3Lin);
        const hexP3 = rgbToHex(
          linearToGamma(clamp(rP3Lin)),
          linearToGamma(clamp(gP3Lin)),
          linearToGamma(clamp(bP3Lin))
        );

        return {
          stop: stop.name,
          L: stop.L,
          C: effectiveC,
          H: hue.H,
          hex,
          hexP3,
          oklch: `oklch(${(stop.L / 100).toFixed(3)} ${effectiveC.toFixed(3)} ${
            hue.H
          })`,
          clipped: !inSrgbGamut,
          clippedP3: !inP3Gamut,
        };
      }),
    }));
  }, [stops, hues]);

  // Statistics
  const stats = useMemo(() => {
    let totalColors = 0,
      clippedColors = 0,
      failingContrast = 0;
    palette.forEach((hue) => {
      hue.colors.forEach((color) => {
        totalColors++;
        if (color.clipped) clippedColors++;
        if (showVsWhite) {
          const contrast = Math.abs(getContrast(color.hex, vsWhiteColor));
          if (contrast < 60) failingContrast++;
        }
      });
    });
    return {
      totalColors,
      clippedColors,
      failingContrast,
      hueCount: hues.length,
      shadeCount: stops.length,
    };
  }, [palette, showVsWhite, vsWhiteColor]);

  // Get colors for display - if reverseInDark, map each shade position to the opposite shade's color
  const getDisplayColors = (hueSet) => {
    if (isDark && reverseInDark) {
      // Create a mapping: shade at position i gets color from position (length - 1 - i)
      return hueSet.colors.map((color, idx) => {
        const invertedColor = hueSet.colors[hueSet.colors.length - 1 - idx];
        // Keep the original stop name but use inverted color values
        return {
          ...invertedColor,
          stop: color.stop, // Keep original stop name for display
          originalStop: invertedColor.stop, // Track which shade the color came from
        };
      });
    }
    return hueSet.colors;
  };

  // Get display color based on color space and grayscale mode
  // For proper sRGB simulation on P3 displays, we need to use color(srgb ...) syntax
  // This tells the browser to render the color in sRGB space, not map it to P3
  const getDisplayColor = (color) => {
    if (grayscalePreview) {
      return hexToGrayscale(color.hex);
    }

    if (effectiveColorSpace === "p3" && nativeColorSpace === "p3") {
      // Use OKLCH directly for P3 - browser will render in P3 gamut
      return color.oklch;
    } else if (previewColorSpace === "srgb" && nativeColorSpace === "p3") {
      // Force sRGB on P3 display - use explicit sRGB color space
      // This ensures the browser renders exactly as it would on an sRGB display
      // by telling it NOT to map to P3 gamut
      const rgb = hexToRgb(color.hex);
      return `color(srgb ${rgb.r.toFixed(4)} ${rgb.g.toFixed(
        4
      )} ${rgb.b.toFixed(4)})`;
    } else {
      // Use sRGB hex - already clipped to sRGB gamut
      return color.hex;
    }
  };

  // Get text color for swatch based on mode
  // Returns { color, meetsThreshold } for suitability modes
  const getSwatchTextColor = (color, hueColors) => {
    if (swatchTextMode === "auto") {
      return {
        color: color.L > swatchTextAutoThreshold ? "#000000" : "#ffffff",
        meetsThreshold: true,
      };
    }
    if (swatchTextMode === "shade") {
      const shadeColor = hueColors.find((c) => c.stop === swatchTextShade);
      return {
        color: shadeColor ? shadeColor.hex : "#000000",
        meetsThreshold: true,
      };
    }
    if (swatchTextMode === "custom") {
      return { color: swatchTextCustom, meetsThreshold: true };
    }
    // Suitability-based modes - find best contrasting color (white or black)
    // that meets the minimum APCA threshold for the selected mode
    const minContrast =
      {
        fluent: 90,
        body: 75,
        large: 60,
        spot: 45,
      }[swatchTextMode] || 60;

    // Calculate APCA: white text on swatch bg, black text on swatch bg
    const whiteOnBg = Math.abs(calculateAPCA("#ffffff", color.hex));
    const blackOnBg = Math.abs(calculateAPCA("#000000", color.hex));

    // Pick the color with higher contrast
    const bestColor = whiteOnBg > blackOnBg ? "#ffffff" : "#000000";
    const bestContrast = Math.max(whiteOnBg, blackOnBg);

    return {
      color: bestColor,
      meetsThreshold: bestContrast >= minContrast,
    };
  };

  // Export generators
  // ✅ Refactored: Use extracted generateExport from lib/exportGenerators
  const handleGenerateExport = useCallback(() => {
    return generateExport(palette, stops, tokens, exportFormat);
  }, [palette, stops, tokens, exportFormat]);

  // Figma export generation
  const generateFigmaPalette = useCallback(
    (existingFile = null) => {
      const existingData = existingFile ? JSON.parse(existingFile) : {};
      const result = {};
      const useP3 = figmaColorProfile === "p3";

      // Helper to convert hex to components (0-1)
      const hexToComponents = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
      };

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
    },
    [
      palette,
      figmaColorProfile,
      shadeSourceMap,
      hueMapping,
      paletteScopes,
      alphaConfig,
      parseAlphaString,
    ]
  );

  const generateFigmaSemanticTokens = useCallback(
    (mode, existingFile = null) => {
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

      // Helper to convert hex to components
      const hexToComponents = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
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

      // Calculate on-color (black or white) based on background luminance
      const getOnColor = (bgComponents) => {
        // Simple luminance calculation
        const L =
          0.2126 * bgComponents[0] +
          0.7152 * bgComponents[1] +
          0.0722 * bgComponents[2];
        // Use threshold to determine if we need black or white text
        const useBlack = L > onColorThreshold / 100;
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
      const onGroundColor = getOnColor(groundColor.components);

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
            components: onGroundColor.components,
            alpha: alpha / 100,
            hex: onGroundColor.hex,
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
          const onIntentColor = getOnColor(defaultComponents);
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

          // Per-on-shade alpha variants from onSemanticShades config
          const onShadeAlphas = parseAlphaString(
            alphaConfig.onSemanticShades?.[shade] || ""
          );
          if (onShadeAlphas.length > 0) {
            const onShadeColor = getOnColor(components);
            const onIntentObj = getOnIntentObj();
            const onShadeTarget = shadeGroup
              ? onIntentObj[shadeGroup]
              : onIntentObj;
            const existingOnIntent = getExistingOnIntent();

            onShadeAlphas.forEach((alpha) => {
              if (!onShadeTarget[shade]) {
                onShadeTarget[shade] = {};
              }
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
          const onHueColor = getOnColor(defaultComponents);
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

          // Per-shade on-hue alpha variants from onPrimitiveShades config
          const onShadeAlphaConfig = alphaConfig.onPrimitiveShades?.[shade];
          if (onShadeAlphaConfig) {
            const onShadeAlphas = parseAlphaString(onShadeAlphaConfig);
            const existingOnHue = getExistingOnHue();
            const onShadeTarget = shadeGroup
              ? isOnNested
                ? result[onGroupName][hueName][shadeGroup]
                : result[`${onPrefix}${hueName}`][shadeGroup]
              : isOnNested
              ? result[onGroupName][hueName]
              : result[`${onPrefix}${hueName}`];

            // Calculate on-color for this shade
            const onHueColor = getOnColor(components);

            onShadeAlphas.forEach((alpha) => {
              const existingOnAlpha =
                existingOnHue[shadeGroup]?.[sourceShade || shade]?.[
                  alpha.toString()
                ] ||
                existingOnHue[sourceShade || shade]?.[alpha.toString()] ||
                null;

              // Initialize shade entry if needed
              if (!onShadeTarget[shade]) {
                onShadeTarget[shade] = {};
              } else if (onShadeTarget[shade].$type) {
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
      onColorThreshold,
      parseAlphaString,
      themeShadeSourceMap,
      starkShades,
      starkDefaultShade,
      reverseInDark,
      stops,
    ]
  );

  // Count tokens in generated JSON
  const countTokens = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      let count = 0;
      const countObject = (obj) => {
        Object.entries(obj).forEach(([key, value]) => {
          // Skip metadata except $root which is a real variable
          if (key.startsWith("$") && key !== "$root") return;
          if (value && typeof value === "object") {
            if (value.$type === "color" || value.$type === "string") {
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

  const downloadFigmaFile = (content, filename) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Delay cleanup to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };
  const updateStop = (i, field, val) => {
    setStops((prev) =>
      prev.map((stop, idx) =>
        idx === i
          ? { ...stop, [field]: field === "name" ? val : parseFloat(val) || 0 }
          : stop
      )
    );
  };
  const updateHue = (i, field, val) => {
    setHues((prev) =>
      prev.map((hue, idx) =>
        idx === i
          ? {
              ...hue,
              [field]:
                field === "name"
                  ? val
                  : field === "fullGray"
                  ? val
                  : parseFloat(val) || 0,
            }
          : hue
      )
    );
  };

  const SectionHeader = ({ title, isOpen, onToggle }) => (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-2 text-left"
      style={{ color: textColor }}
    >
      <span className="text-xs font-semibold uppercase tracking-wide">
        {title}
      </span>
      {isOpen ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  // Tooltip component with no delay
  const Tooltip = ({ children, content }) => (
    <div className="group relative inline-flex w-full">
      {children}
      <div
        className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-75 whitespace-nowrap z-50"
        style={{
          backgroundColor: isDark ? "#525252" : "#262626",
          color: "#fff",
        }}
      >
        {content}
      </div>
    </div>
  );

  const CopyableAttr = ({ value, id, title }) => (
    <Tooltip content={title || value}>
      <button
        onClick={() => copyToClipboard(value, id)}
        className="font-mono h-4 flex items-center justify-center gap-0.5 px-0.5"
        style={{ color: textMuted, minWidth: swatchSize, fontSize: 10 }}
      >
        <span className="truncate">{value}</span>
        {copiedIndex === id && <Check className="w-3 h-3 flex-shrink-0" />}
      </button>
    </Tooltip>
  );

  // Simple label for contrast values - no copy, no tooltip
  const ContrastLabel = ({ value, passes }) => (
    <div
      className="font-mono h-4 flex items-center justify-center gap-0.5 px-0.5"
      style={{
        color: passes ? textColor : textMuted,
        fontWeight: passes ? 600 : 400,
        minWidth: swatchSize,
        fontSize: 10,
      }}
    >
      <span>{value}</span>
      {passes && <span style={{ fontSize: 9 }}>✓</span>}
    </div>
  );

  const inputStyle = {
    backgroundColor: inputBg,
    borderColor,
    color: textColor,
  };
  const labelStyle = { color: textMuted };

  const getAttrLabels = () => {
    const labels = [];
    if (showOKLCH) labels.push("OKLCH");
    if (showSRGB) labels.push("HEX");
    if (showP3) labels.push("P3");
    if (showVsWhite) labels.push("vs White");
    if (showVsBlack) labels.push("vs Black");
    if (showVsBg) labels.push("vs Bg");
    if (showVsShade) labels.push(`vs ${contrastShade}`);
    return labels;
  };

  // Get color space dropdown label
  const getColorSpaceLabel = () => {
    if (previewColorSpace === "native") {
      return `Native (${nativeColorSpace.toUpperCase()})`;
    }
    return previewColorSpace.toUpperCase();
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: currentBg, color: textColor }}
    >
      <style>{`
        [title] { position: relative; }
        .tooltip-instant:hover::after {
          content: attr(data-tip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 8px;
          background: ${isDark ? "#525252" : "#262626"};
          color: white;
          font-size: 11px;
          border-radius: 4px;
          white-space: nowrap;
          z-index: 100;
        }
      `}</style>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{ backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5" }}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold">SirvUI Palette Machine</h1>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: isDark ? "#333" : "#f0f0f0",
                color: textMuted,
              }}
            >
              {stats.hueCount}×{stats.shadeCount} = {stats.totalColors} colors
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5 mr-2">
              <Tooltip content="Undo (⌘Z)">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-1.5 rounded hover:bg-gray-500 hover:bg-opacity-20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-4 h-4" style={{ color: textMuted }} />
                </button>
              </Tooltip>
              <Tooltip content="Redo (⌘⇧Z)">
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-1.5 rounded hover:bg-gray-500 hover:bg-opacity-20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Redo2 className="w-4 h-4" style={{ color: textMuted }} />
                </button>
              </Tooltip>
            </div>

            <Tooltip content="Reset to defaults">
              <button
                onClick={resetToDefaults}
                className="p-1.5 rounded hover:bg-gray-500 hover:bg-opacity-20"
              >
                <RotateCcw className="w-4 h-4" style={{ color: textMuted }} />
              </button>
            </Tooltip>

            <div
              className="w-px h-5 mx-1"
              style={{ backgroundColor: borderColor }}
            />

            {/* Gamut selector - moved before B&W and theme */}
            <div className="flex items-center gap-1.5 text-xs">
              <Monitor className="w-4 h-4" style={{ color: textMuted }} />
              <select
                value={previewColorSpace}
                onChange={(e) => setPreviewColorSpace(e.target.value)}
                className="bg-transparent border-none text-xs cursor-pointer pr-4"
                style={{ color: textMuted }}
              >
                <option value="native">
                  Native ({nativeColorSpace.toUpperCase()})
                </option>
                <option value="srgb">Force sRGB</option>
                {nativeColorSpace === "p3" && (
                  <option value="p3">Force P3</option>
                )}
              </select>
            </div>

            {/* Grayscale preview toggle */}
            <Tooltip
              content={grayscalePreview ? "Color preview" : "Grayscale preview"}
            >
              <button
                onClick={() => setGrayscalePreview(!grayscalePreview)}
                className={`p-1.5 rounded hover:bg-gray-500 hover:bg-opacity-20 ${
                  grayscalePreview ? "bg-gray-500 bg-opacity-20" : ""
                }`}
              >
                <Eye
                  className="w-4 h-4"
                  style={{ color: grayscalePreview ? textColor : textMuted }}
                />
              </button>
            </Tooltip>

            {/* Theme toggle */}
            <Tooltip
              content={
                isDark ? "Switch to light theme" : "Switch to dark theme"
              }
            >
              <button
                onClick={() => setMode(isDark ? "light" : "dark")}
                className="p-1.5 rounded hover:bg-gray-500 hover:bg-opacity-20"
              >
                {isDark ? (
                  <Sun className="w-4 h-4" style={{ color: textMuted }} />
                ) : (
                  <Moon className="w-4 h-4" style={{ color: textMuted }} />
                )}
              </button>
            </Tooltip>

            <div className="flex gap-1.5">
              {["palette", "shades", "hues", "json", "figma"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded capitalize ${
                    activeTab === tab ? "bg-blue-600 text-white" : ""
                  }`}
                  style={{
                    color: activeTab === tab ? undefined : textColor,
                    backgroundColor:
                      activeTab === tab
                        ? undefined
                        : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
                  }}
                >
                  {tab === "json" ? "JSON" : tab === "figma" ? "Figma" : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === "palette" && (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-52 flex-shrink-0 overflow-y-auto p-3 space-y-2">
              <div
                className="rounded-lg p-2.5"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <SectionHeader
                  title="Theme"
                  isOpen={themeOpen}
                  onToggle={() => setThemeOpen(!themeOpen)}
                />
                {themeOpen && (
                  <div className="space-y-2 mt-2">
                    <div
                      className="flex rounded overflow-hidden"
                      style={{ border: `1px solid ${borderColor}` }}
                    >
                      <button
                        onClick={() => setMode("light")}
                        className={`flex-1 py-1 text-xs ${
                          mode === "light" ? "bg-blue-600 text-white" : ""
                        }`}
                        style={
                          mode !== "light" ? { backgroundColor: inputBg } : {}
                        }
                      >
                        Light
                      </button>
                      <button
                        onClick={() => setMode("dark")}
                        className={`flex-1 py-1 text-xs ${
                          mode === "dark" ? "bg-blue-600 text-white" : ""
                        }`}
                        style={
                          mode !== "dark" ? { backgroundColor: inputBg } : {}
                        }
                      >
                        Dark
                      </button>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={bgColorLight}
                        onChange={(e) => setBgColorLight(e.target.value)}
                        className="w-5 h-5 flex-shrink-0 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={bgColorLight}
                        onChange={(e) => setBgColorLight(e.target.value)}
                        className="min-w-0 flex-1 px-1.5 py-0.5 rounded text-xs font-mono border"
                        style={inputStyle}
                      />
                      <span className="text-xs" style={labelStyle}>
                        L
                      </span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={bgColorDark}
                        onChange={(e) => setBgColorDark(e.target.value)}
                        className="w-5 h-5 flex-shrink-0 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={bgColorDark}
                        onChange={(e) => setBgColorDark(e.target.value)}
                        className="min-w-0 flex-1 px-1.5 py-0.5 rounded text-xs font-mono border"
                        style={inputStyle}
                      />
                      <span className="text-xs" style={labelStyle}>
                        D
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reverseInDark}
                        onChange={(e) => setReverseInDark(e.target.checked)}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-xs">Invert scale in dark</span>
                    </label>
                    <div>
                      <label className="text-xs block mb-1" style={labelStyle}>
                        Size: {swatchSize}px
                      </label>
                      <input
                        type="range"
                        min="56"
                        max="100"
                        value={swatchSize}
                        onChange={(e) => setSwatchSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div
                className="rounded-lg p-2.5"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <SectionHeader
                  title="Values"
                  isOpen={colorModelOpen}
                  onToggle={() => setColorModelOpen(!colorModelOpen)}
                />
                {colorModelOpen && (
                  <div className="space-y-2 mt-2">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOKLCH}
                          onChange={(e) => setShowOKLCH(e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs">OKLCH</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showSRGB}
                          onChange={(e) => setShowSRGB(e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs">sRGB HEX</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showP3}
                          onChange={(e) => setShowP3(e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs">P3 HEX</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showGamutWarn}
                          onChange={(e) => setShowGamutWarn(e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs">Gamut warnings</span>
                      </label>
                    </div>
                    <div
                      className="pt-2"
                      style={{ borderTop: `1px solid ${borderColor}` }}
                    >
                      <label
                        className="text-xs block mb-1.5"
                        style={labelStyle}
                      >
                        Swatch text color
                      </label>
                      <select
                        value={swatchTextMode}
                        onChange={(e) => setSwatchTextMode(e.target.value)}
                        className="w-full px-2 py-1 rounded text-xs border mb-1.5"
                        style={inputStyle}
                      >
                        <option value="auto">Auto (by Lightness)</option>
                        <optgroup label="By APCA suitability">
                          <option value="fluent">Fluent (90+)</option>
                          <option value="body">Body (75+)</option>
                          <option value="large">Large (60+)</option>
                          <option value="spot">Spot (45+)</option>
                        </optgroup>
                        <option value="shade">From shade</option>
                        <option value="custom">Custom color</option>
                      </select>
                      {swatchTextMode === "auto" && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={labelStyle}>
                            Switch at L:
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="5"
                            value={swatchTextAutoThreshold}
                            onChange={(e) =>
                              setSwatchTextAutoThreshold(Number(e.target.value))
                            }
                            className="w-14 px-1.5 py-0.5 rounded text-xs border"
                            style={inputStyle}
                          />
                        </div>
                      )}
                      {swatchTextMode === "shade" && (
                        <select
                          value={swatchTextShade}
                          onChange={(e) => setSwatchTextShade(e.target.value)}
                          className="w-full px-2 py-1 rounded text-xs border"
                          style={inputStyle}
                        >
                          {stops.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {swatchTextMode === "custom" && (
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={swatchTextCustom}
                            onChange={(e) =>
                              setSwatchTextCustom(e.target.value)
                            }
                            className="w-5 h-5 flex-shrink-0 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={swatchTextCustom}
                            onChange={(e) =>
                              setSwatchTextCustom(e.target.value)
                            }
                            className="min-w-0 flex-1 px-1.5 py-0.5 rounded text-xs font-mono border"
                            style={inputStyle}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="rounded-lg p-2.5"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <SectionHeader
                  title="Contrast"
                  isOpen={contrastOpen}
                  onToggle={() => setContrastOpen(!contrastOpen)}
                />
                {contrastOpen && (
                  <div className="space-y-2 mt-2">
                    <select
                      value={contrastAlgo}
                      onChange={(e) => setContrastAlgo(e.target.value)}
                      className="w-full px-2 py-1 rounded text-xs border"
                      style={inputStyle}
                    >
                      <option value="APCA">APCA</option>
                      <option value="WCAG">WCAG 2.1</option>
                    </select>
                    {contrastAlgo === "APCA" && (
                      <select
                        value={contrastDirection}
                        onChange={(e) => setContrastDirection(e.target.value)}
                        className="w-full px-2 py-1 rounded text-xs border"
                        style={inputStyle}
                      >
                        <option value="text-on-bg">Color = Text</option>
                        <option value="bg-under-text">
                          Color = Background
                        </option>
                      </select>
                    )}
                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVsWhite}
                          onChange={(e) => setShowVsWhite(e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs">vs</span>
                        <input
                          type="text"
                          value={vsWhiteColor}
                          onChange={(e) => setVsWhiteColor(e.target.value)}
                          className="w-16 px-1 py-0.5 rounded text-xs font-mono border"
                          style={inputStyle}
                          disabled={!showVsWhite}
                        />
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVsBlack}
                          onChange={(e) => setShowVsBlack(e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs">vs</span>
                        <input
                          type="text"
                          value={vsBlackColor}
                          onChange={(e) => setVsBlackColor(e.target.value)}
                          className="w-16 px-1 py-0.5 rounded text-xs font-mono border"
                          style={inputStyle}
                          disabled={!showVsBlack}
                        />
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVsBg}
                          onChange={(e) => setShowVsBg(e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs">vs Background</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showVsShade}
                          onChange={(e) => setShowVsShade(e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span className="text-xs">vs shade</span>
                        <select
                          value={contrastShade}
                          onChange={(e) => setContrastShade(e.target.value)}
                          className="w-14 px-1 py-0.5 rounded text-xs border"
                          style={inputStyle}
                          disabled={!showVsShade}
                        >
                          {stops.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {contrastAlgo === "APCA" && (
                      <div
                        className="pt-2"
                        style={{ borderTop: `1px solid ${borderColor}` }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs" style={labelStyle}>
                            Check contrast
                          </label>
                          <a
                            href="https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            Learn more
                          </a>
                        </div>
                        <select
                          value={contrastThreshold}
                          onChange={(e) =>
                            setContrastThreshold(Number(e.target.value))
                          }
                          className="w-full px-2 py-1 rounded text-xs border"
                          style={inputStyle}
                        >
                          <option value={0}>None</option>
                          <option value={90}>90+ Fluent (12px text)</option>
                          <option value={75}>75+ Body (14-16px)</option>
                          <option value={60}>60+ Large (24px+)</option>
                          <option value={45}>45+ Spot (36px+)</option>
                          <option value={30}>30+ Sub (borders)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Palette Grid */}
            <div className="flex-1 overflow-auto">
              <div className="flex justify-center">
                <div className="inline-block p-4">
                  <div
                    className="sticky top-0 z-10 flex -mt-4 pt-4"
                    style={{ backgroundColor: currentBg }}
                  >
                    <div style={{ width: 80 }} />
                    {stops.map((stop, idx) => {
                      // When inverted in dark mode, show L/C from the opposite end of the scale
                      const sourceIdx =
                        isDark && reverseInDark ? stops.length - 1 - idx : idx;
                      const displayStop = stops[sourceIdx];
                      return (
                        <div
                          key={stop.name}
                          className="text-center font-mono py-1 flex flex-col items-center"
                          style={{ minWidth: swatchSize, width: swatchSize }}
                        >
                          <span
                            style={{
                              color: textColor,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {stop.name}
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={displayStop.L}
                            onChange={(e) =>
                              updateStop(sourceIdx, "L", e.target.value)
                            }
                            className="w-10 text-center bg-transparent border-b font-mono focus:outline-none focus:border-blue-500"
                            style={{
                              color: textMuted,
                              fontSize: 9,
                              borderColor: "transparent",
                            }}
                            title="Lightness"
                          />
                          <input
                            type="number"
                            min="0"
                            max="0.4"
                            step="0.01"
                            value={displayStop.C}
                            onChange={(e) =>
                              updateStop(sourceIdx, "C", e.target.value)
                            }
                            className="w-10 text-center bg-transparent border-b font-mono focus:outline-none focus:border-blue-500"
                            style={{
                              color: textMuted,
                              fontSize: 9,
                              borderColor: "transparent",
                            }}
                            title="Chroma"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    {palette.map((hueSet, hueIdx) => {
                      const displayColors = getDisplayColors(hueSet);
                      const attrLabels = getAttrLabels();
                      return (
                        <div key={hueSet.name} className="flex">
                          <div
                            className="flex flex-col pr-2"
                            style={{ width: 80 }}
                          >
                            <div
                              className="flex flex-col justify-center"
                              style={{ height: swatchSize }}
                            >
                              <span
                                className="font-mono"
                                style={{
                                  color: textColor,
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {hueSet.name}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <span
                                  className="font-mono"
                                  style={{ color: textMuted, fontSize: 9 }}
                                >
                                  H:
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="360"
                                  step="1"
                                  value={hueSet.H}
                                  onChange={(e) =>
                                    updateHue(hueIdx, "H", e.target.value)
                                  }
                                  className="w-8 bg-transparent border-b font-mono focus:outline-none focus:border-blue-500"
                                  style={{
                                    color: textMuted,
                                    fontSize: 9,
                                    borderColor: "transparent",
                                  }}
                                  title="Hue angle"
                                />
                                <span
                                  className="font-mono"
                                  style={{ color: textMuted, fontSize: 9 }}
                                >
                                  °
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col py-1 gap-0.5">
                              {attrLabels.map((label, i) => (
                                <span
                                  key={i}
                                  className="text-left font-mono h-4"
                                  style={{ color: textMuted, fontSize: 9 }}
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                          {displayColors.map((color, idx) => {
                            const displayColor = getDisplayColor(color);
                            const swatchTextResult = getSwatchTextColor(
                              color,
                              displayColors
                            );
                            const isClipped =
                              effectiveColorSpace === "p3"
                                ? color.clippedP3
                                : color.clipped;
                            // color.hex is already the display color (inverted in dark mode if reverseInDark)
                            const colorHexForContrast = color.hex;
                            const contrastW = showVsWhite
                              ? getContrast(
                                  colorHexForContrast,
                                  cssColorToHex(vsWhiteColor)
                                )
                              : null;
                            const contrastB = showVsBlack
                              ? getContrast(
                                  colorHexForContrast,
                                  cssColorToHex(vsBlackColor)
                                )
                              : null;
                            const contrastBg = showVsBg
                              ? getContrast(colorHexForContrast, currentBgHex)
                              : null;
                            // Use displayColors for shade comparison so it respects inversion
                            const contrastS = showVsShade
                              ? getContrast(
                                  colorHexForContrast,
                                  displayColors.find(
                                    (c) => c.stop === contrastShade
                                  )?.hex || "#fff"
                                )
                              : null;
                            // Check if contrast values meet threshold (for APCA)
                            const checkThreshold = (val) =>
                              contrastThreshold === 0 ||
                              contrastAlgo !== "APCA" ||
                              Math.abs(val) >= contrastThreshold;
                            return (
                              <div
                                key={idx}
                                style={{
                                  minWidth: swatchSize,
                                  width: swatchSize,
                                }}
                              >
                                <Tooltip content={`Click to copy ${color.hex}`}>
                                  <div
                                    className="cursor-pointer flex items-center justify-center relative w-full"
                                    style={{
                                      backgroundColor: displayColor,
                                      height: swatchSize,
                                    }}
                                    onClick={() =>
                                      copyToClipboard(
                                        color.hex,
                                        `sw-${hueSet.name}-${idx}`
                                      )
                                    }
                                  >
                                    <span
                                      className="font-mono"
                                      style={{
                                        color: swatchTextResult.color,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        opacity: swatchTextResult.meetsThreshold
                                          ? 1
                                          : 0.4,
                                        textDecoration:
                                          swatchTextResult.meetsThreshold
                                            ? "none"
                                            : "line-through",
                                      }}
                                    >
                                      {color.stop}
                                    </span>
                                    {isClipped && showGamutWarn && (
                                      <AlertTriangle
                                        className="absolute top-0.5 right-0.5 w-3 h-3"
                                        style={{
                                          color: swatchTextResult.color,
                                        }}
                                      />
                                    )}
                                    {copiedIndex ===
                                      `sw-${hueSet.name}-${idx}` && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                        <Check className="w-5 h-5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </Tooltip>
                                <div className="flex flex-col items-center py-1 gap-0.5">
                                  {showOKLCH && (
                                    <CopyableAttr
                                      value={color.oklch}
                                      id={`ok-${hueSet.name}-${idx}`}
                                    />
                                  )}
                                  {showSRGB && (
                                    <CopyableAttr
                                      value={color.hex}
                                      id={`sr-${hueSet.name}-${idx}`}
                                    />
                                  )}
                                  {showP3 && (
                                    <CopyableAttr
                                      value={color.hexP3}
                                      id={`p3-${hueSet.name}-${idx}`}
                                    />
                                  )}
                                  {showVsWhite && (
                                    <ContrastLabel
                                      value={formatContrast(contrastW)}
                                      passes={
                                        contrastThreshold > 0 &&
                                        checkThreshold(contrastW)
                                      }
                                    />
                                  )}
                                  {showVsBlack && (
                                    <ContrastLabel
                                      value={formatContrast(contrastB)}
                                      passes={
                                        contrastThreshold > 0 &&
                                        checkThreshold(contrastB)
                                      }
                                    />
                                  )}
                                  {showVsBg && (
                                    <ContrastLabel
                                      value={formatContrast(contrastBg)}
                                      passes={
                                        contrastThreshold > 0 &&
                                        checkThreshold(contrastBg)
                                      }
                                    />
                                  )}
                                  {showVsShade && (
                                    <ContrastLabel
                                      value={formatContrast(contrastS)}
                                      passes={
                                        contrastThreshold > 0 &&
                                        checkThreshold(contrastS)
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "shades" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex justify-center">
              <div
                className="rounded-lg p-5 w-full max-w-2xl"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <h2 className="text-base font-semibold mb-4">
                  Shades (Lightness & Chroma)
                </h2>
                <p className="text-xs mb-4" style={{ color: textMuted }}>
                  Define the lightness (L) and base chroma (C) for each shade
                  level.
                </p>
                <div className="space-y-1.5">
                  {stops.map((stop, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-5 gap-2 items-center p-2 rounded"
                      style={{ backgroundColor: isDark ? "#333" : "#f9fafb" }}
                    >
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(e) => updateStop(i, "name", e.target.value)}
                        className="px-2 py-1 rounded border text-sm font-mono"
                        style={inputStyle}
                        placeholder="Name"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={labelStyle}>
                          L
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={stop.L}
                          onChange={(e) => updateStop(i, "L", e.target.value)}
                          className="w-full px-2 py-1 rounded border text-sm"
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={labelStyle}>
                          C
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="0.4"
                          step="0.005"
                          value={stop.C}
                          onChange={(e) => updateStop(i, "C", e.target.value)}
                          className="w-full px-2 py-1 rounded border text-sm"
                          style={inputStyle}
                        />
                      </div>
                      <Tooltip content={`oklch(${stop.L}% ${stop.C} 250)`}>
                        <div
                          className="h-6 w-full rounded"
                          style={{
                            backgroundColor: `oklch(${stop.L}% ${stop.C} 250)`,
                          }}
                        />
                      </Tooltip>
                      <Tooltip content={`oklch(${stop.L}% 0 0) - Grayscale`}>
                        <div
                          className="h-6 w-full rounded"
                          style={{ backgroundColor: `oklch(${stop.L}% 0 0)` }}
                        />
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "hues" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex justify-center">
              <div
                className="rounded-lg p-5 w-full max-w-3xl"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold">Hues</h2>
                    <p className="text-xs mt-1" style={{ color: textMuted }}>
                      Define color names and hue angles (0-360°). Check "Gray"
                      for neutral grayscale.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setHues([
                        ...hues,
                        { name: `hue-${hues.length}`, H: 0, fullGray: false },
                      ])
                    }
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-1.5">
                  {hues.map((hue, i) => (
                    <div
                      key={i}
                      className="grid gap-2 items-center p-2 rounded"
                      style={{
                        backgroundColor: isDark ? "#333" : "#f9fafb",
                        gridTemplateColumns: "1fr 80px 50px 32px",
                      }}
                    >
                      <input
                        type="text"
                        value={hue.name}
                        onChange={(e) => updateHue(i, "name", e.target.value)}
                        className="px-2 py-1 rounded border text-sm"
                        style={inputStyle}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={labelStyle}>
                          H
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="360"
                          step="1"
                          value={hue.H}
                          onChange={(e) => updateHue(i, "H", e.target.value)}
                          className="w-full px-2 py-1 rounded border text-sm"
                          style={inputStyle}
                        />
                      </div>
                      <Tooltip content="Grayscale (zero chroma)">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hue.fullGray}
                            onChange={(e) =>
                              updateHue(i, "fullGray", e.target.checked)
                            }
                            className="w-3.5 h-3.5"
                          />
                          <span className="text-xs">Gray</span>
                        </label>
                      </Tooltip>
                      <button
                        onClick={() =>
                          setHues(hues.filter((_, idx) => idx !== i))
                        }
                        className="p-1 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded"
                        disabled={hues.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "json" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex justify-center">
              <div className="w-full max-w-4xl space-y-6">
                {/* Import Section */}
                <div
                  className="rounded-lg p-5"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold">
                        Import Configuration
                      </h2>
                      <p className="text-xs mt-1" style={{ color: textMuted }}>
                        Paste or edit JSON configuration, then click "Apply" to
                        load.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(
                              {
                                stops,
                                hues,
                                settings: {
                                  bgColorLight,
                                  bgColorDark,
                                  swatchSize,
                                },
                              },
                              null,
                              2
                            ),
                            "json-copy"
                          )
                        }
                        className="px-3 py-1 rounded text-sm flex items-center gap-1"
                        style={{
                          backgroundColor: isDark ? "#333" : "#e5e5e5",
                          color: textColor,
                        }}
                      >
                        {copiedIndex === "json-copy" ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}{" "}
                        Copy Current
                      </button>
                      <button
                        onClick={() => {
                          try {
                            const config = JSON.parse(jsonEditValue);
                            if (config.stops) setStops(config.stops);
                            if (config.hues) setHues(config.hues);
                            if (config.tokens) setTokens(config.tokens);
                            if (config.settings) {
                              if (config.settings.bgColorLight)
                                setBgColorLight(config.settings.bgColorLight);
                              if (config.settings.bgColorDark)
                                setBgColorDark(config.settings.bgColorDark);
                              if (config.settings.swatchSize)
                                setSwatchSize(config.settings.swatchSize);
                            }
                            setJsonError(null);
                          } catch (err) {
                            setJsonError(err.message);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  {jsonError && (
                    <div className="mb-2 p-2 rounded text-sm bg-red-500 bg-opacity-20 text-red-400">
                      {jsonError}
                    </div>
                  )}
                  <textarea
                    value={jsonEditValue}
                    onChange={(e) => setJsonEditValue(e.target.value)}
                    className="w-full p-4 rounded-lg text-xs font-mono resize-none"
                    style={{
                      backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                      color: textColor,
                      border: `1px solid ${borderColor}`,
                      minHeight: 300,
                    }}
                    spellCheck={false}
                  />
                </div>

                {/* Export Section */}
                <div
                  className="rounded-lg p-5"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">Export Palette</h2>
                    <div className="flex gap-2 items-center">
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="px-2 py-1 rounded border text-sm"
                        style={inputStyle}
                      >
                        <option value="json-srgb">JSON (sRGB)</option>
                        <option value="json-p3">JSON (P3)</option>
                        <option value="json-oklch">JSON (OKLCH)</option>
                        <option value="css">CSS Variables</option>
                        <option value="tailwind">Tailwind Config</option>
                        <option value="scss">SCSS Variables</option>
                      </select>
                      <button
                        onClick={() =>
                          copyToClipboard(handleGenerateExport(), "export")
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                      >
                        {copiedIndex === "export" ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}{" "}
                        Copy
                      </button>
                    </div>
                  </div>
                  <pre
                    className="p-4 rounded-lg overflow-auto text-xs font-mono max-h-80"
                    style={{
                      backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                      color: textColor,
                    }}
                  >
                    {handleGenerateExport()}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "figma" && (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex justify-center">
              <div className="w-full max-w-4xl space-y-4">
                {/* Header */}
                <div
                  className="rounded-lg p-5"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <h2 className="text-lg font-semibold mb-1">
                    Figma Variables Export
                  </h2>
                  <p className="text-sm" style={{ color: textMuted }}>
                    Generate Figma-compatible variable files for your design
                    system.
                  </p>
                </div>

                {/* Token Taxonomy Reference - consolidated info block */}
                <InfoBlock
                  title="📚 Token Taxonomy & Structure"
                  isOpen={exportSections.concepts}
                  onToggle={() => toggleSection("concepts")}
                >
                  <div className="space-y-6 text-sm">
                    {/* Collections Overview */}
                    <div>
                      <h4 className="font-semibold mb-2">Collections</h4>
                      <div className="space-y-3">
                        <div
                          className="p-3 rounded"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <code
                              className="px-1.5 py-0.5 rounded text-xs font-bold"
                              style={{
                                backgroundColor: isDark ? "#333" : "#ddd",
                              }}
                            >
                              palette
                            </code>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: isDark ? "#4a2a2a" : "#fef2f2",
                                color: isDark ? "#f87171" : "#dc2626",
                              }}
                            >
                              internal only
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: textMuted }}>
                            Primitive colors (gray, blue, red...) with shades
                            0-1000. Hidden from designers via scopes. Code
                            syntax = raw CSS variable:{" "}
                            <code
                              className="px-1 rounded"
                              style={{
                                backgroundColor: isDark ? "#333" : "#ddd",
                              }}
                            >
                              --blue-500
                            </code>
                          </p>
                        </div>
                        <div
                          className="p-3 rounded"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <code
                              className="px-1.5 py-0.5 rounded text-xs font-bold"
                              style={{
                                backgroundColor: isDark ? "#333" : "#ddd",
                              }}
                            >
                              theme
                            </code>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: isDark ? "#2a4a2a" : "#f0fdf4",
                                color: isDark ? "#4ade80" : "#16a34a",
                              }}
                            >
                              for usage
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: textMuted }}>
                            Semantic tokens with light/dark modes. This is what
                            designers use. Code syntax = Tailwind class:{" "}
                            <code
                              className="px-1 rounded"
                              style={{
                                backgroundColor: isDark ? "#333" : "#ddd",
                              }}
                            >
                              bg-primary-500
                            </code>
                            ,{" "}
                            <code
                              className="px-1 rounded"
                              style={{
                                backgroundColor: isDark ? "#333" : "#ddd",
                              }}
                            >
                              text-on-primary/15
                            </code>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Token Structure Table */}
                    <div>
                      <h4 className="font-semibold mb-3">
                        Token Path Structure
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr
                              style={{
                                backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                              }}
                            >
                              <th
                                className="text-left p-2 border"
                                style={{ borderColor }}
                              >
                                Figma Path
                              </th>
                              <th
                                className="text-left p-2 border"
                                style={{ borderColor }}
                              >
                                Code Syntax
                              </th>
                              <th
                                className="text-left p-2 border"
                                style={{ borderColor }}
                              >
                                Tailwind Usage
                              </th>
                            </tr>
                          </thead>
                          <tbody className="font-mono">
                            {/* Theme: Intents/Hues with shades */}
                            <tr>
                              <td
                                colSpan="3"
                                className="p-2 font-sans font-semibold"
                                style={{
                                  backgroundColor: isDark
                                    ? "#1a1a1a"
                                    : "#f5f5f5",
                                }}
                              >
                                Theme: Intents & Hues (primary, danger, blue,
                                etc.)
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/
                                <span style={{ color: "#6b9" }}>primary</span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                primary
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                bg-primary
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/primary/
                                <span style={{ color: "#6b9" }}>shade</span>/100
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                primary-100
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                bg-primary-100
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/primary/shade/100/
                                <span style={{ color: "#f90" }}>15</span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                primary-100/15
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                bg-primary-100/15
                              </td>
                            </tr>

                            {/* Theme: On-colors */}
                            <tr>
                              <td
                                colSpan="3"
                                className="p-2 font-sans font-semibold"
                                style={{
                                  backgroundColor: isDark
                                    ? "#1a1a1a"
                                    : "#f5f5f5",
                                }}
                              >
                                Theme: Foreground (on-) Colors
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/<span style={{ color: "#6b9" }}>on</span>
                                /primary/
                                <span style={{ color: "#f90" }}>15</span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                on-primary/15
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                text-on-primary/15
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/on/primary/
                                <span style={{ color: "#6b9" }}>shade</span>/100
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                on-primary-100
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                text-on-primary-100
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/on/primary/shade/100/
                                <span style={{ color: "#f90" }}>15</span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                on-primary-100/15
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                text-on-primary-100/15
                              </td>
                            </tr>

                            {/* Theme: Ground/Black/White - no shades */}
                            <tr>
                              <td
                                colSpan="3"
                                className="p-2 font-sans font-semibold"
                                style={{
                                  backgroundColor: isDark
                                    ? "#1a1a1a"
                                    : "#f5f5f5",
                                }}
                              >
                                Theme: Ground, Black, White (no shades)
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/
                                <span style={{ color: "#6b9" }}>ground</span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                ground
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                bg-ground
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/ground/
                                <span style={{ color: "#f90" }}>15</span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                ground/15
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                bg-ground/15
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                theme/on/ground/
                                <span style={{ color: "#f90" }}>15</span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                on-ground/15
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor, color: textMuted }}
                              >
                                text-on-ground/15
                              </td>
                            </tr>

                            {/* Palette primitives */}
                            <tr>
                              <td
                                colSpan="3"
                                className="p-2 font-sans font-semibold"
                                style={{
                                  backgroundColor: isDark
                                    ? "#1a1a1a"
                                    : "#f5f5f5",
                                }}
                              >
                                Palette: Primitives (flat structure, internal
                                use)
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                palette/
                                <span style={{ color: "#6b9" }}>--gray</span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                --gray
                              </td>
                              <td
                                className="p-2 border font-sans"
                                style={{ borderColor, color: textMuted }}
                              >
                                n/a (internal)
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                palette/
                                <span style={{ color: "#6b9" }}>
                                  --gray-500
                                </span>
                              </td>
                              <td
                                className="p-2 border"
                                style={{ borderColor }}
                              >
                                --gray-500
                              </td>
                              <td
                                className="p-2 border font-sans"
                                style={{ borderColor, color: textMuted }}
                              >
                                n/a (internal)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Key Concepts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="p-3 rounded"
                        style={{
                          backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                        }}
                      >
                        <h5 className="font-semibold text-xs mb-2">
                          Shades vs Alphas
                        </h5>
                        <ul
                          className="text-xs space-y-1"
                          style={{ color: textMuted }}
                        >
                          <li>
                            <code>primary/shade/500</code> → shade (lightness)
                          </li>
                          <li>
                            <code>primary/15</code> → alpha (opacity 15%)
                          </li>
                          <li>Shades: 0, 50, 100...900, 950, 1000</li>
                          <li>Alphas: 3, 5, 10, 15, 20, 25...100</li>
                        </ul>
                      </div>
                      <div
                        className="p-3 rounded"
                        style={{
                          backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                        }}
                      >
                        <h5 className="font-semibold text-xs mb-2">
                          Naming Convention
                        </h5>
                        <ul
                          className="text-xs space-y-1"
                          style={{ color: textMuted }}
                        >
                          <li>
                            Figma paths use <code>/</code> for hierarchy
                          </li>
                          <li>
                            Code syntax: <code>-</code> for shades,{" "}
                            <code>/</code> for alpha
                          </li>
                          <li>
                            <code>primary-500</code> = shade 500
                          </li>
                          <li>
                            <code>primary/15</code> = 15% opacity
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="p-3 rounded"
                        style={{
                          backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                        }}
                      >
                        <h5 className="font-semibold text-xs mb-2">
                          Dark Mode
                        </h5>
                        <ul
                          className="text-xs space-y-1"
                          style={{ color: textMuted }}
                        >
                          <li>Theme shades reverse around 500 pivot</li>
                          <li>100→900, 400→600, 500→500</li>
                          <li>Exceptions: black, white, ground</li>
                        </ul>
                      </div>
                      <div
                        className="p-3 rounded"
                        style={{
                          backgroundColor: isDark ? "#1a1a1a" : "#f0f0f0",
                        }}
                      >
                        <h5 className="font-semibold text-xs mb-2">
                          File Detection
                        </h5>
                        <ul
                          className="text-xs space-y-1"
                          style={{ color: textMuted }}
                        >
                          <li>
                            Numbers in <code>/shade/</code> group → shades
                          </li>
                          <li>Numbers directly on intent → alphas</li>
                          <li>Theme Mapping uses only shades</li>
                        </ul>
                      </div>
                    </div>

                    {/* Why this structure */}
                    <div
                      className="p-3 rounded text-xs"
                      style={{
                        backgroundColor: isDark ? "#1a2a1a" : "#f0fff0",
                        border: `1px solid ${isDark ? "#2a4a2a" : "#c0e0c0"}`,
                      }}
                    >
                      <h5 className="font-semibold mb-1">
                        💡 Why this structure?
                      </h5>
                      <p style={{ color: textMuted }}>
                        The <code>/shade/</code> subgroup in Figma enables smart
                        autocomplete: typing "pri 50" suggests alpha variants
                        first (common case), while "pri sha 500" explicitly
                        targets shades. The <code>/on/</code> prefix groups all
                        foreground colors together for easy discovery. Palette
                        primitives use <code>--</code> prefix to indicate
                        they're raw CSS variables, not meant for direct Tailwind
                        usage.
                      </p>
                    </div>
                  </div>
                </InfoBlock>

                {/* File Upload Section */}
                <ConfigSection
                  title="📁 Upload Existing Files"
                  description="Upload your current Figma variable files to preserve variableIds and analyze existing structure."
                  isOpen={exportSections.files}
                  onToggle={() => toggleSection("files")}
                >
                  <div className="space-y-4">
                    {/* palette.tokens.json */}
                    <div
                      className="p-4 rounded"
                      style={{
                        backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                        border: figmaPaletteFile
                          ? "1px solid #22c55e"
                          : "1px solid #f59e0b",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">
                          palette.tokens.json
                        </h4>
                        {parsedPaletteFile && !parsedPaletteFile.error && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500 bg-opacity-20 text-green-400">
                            {parsedPaletteFile.hues.length} hues ×{" "}
                            {parsedPaletteFile.shades.length} shades
                          </span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) =>
                              handlePaletteFileUpload(ev.target.result);
                            reader.readAsText(file);
                          }
                        }}
                        className="text-xs mb-2"
                      />
                      {figmaPaletteFile ? (
                        <div className="space-y-1">
                          <p className="text-xs text-green-500">
                            ✓ File loaded - variableIds will be preserved
                          </p>
                          {parsedPaletteFile && !parsedPaletteFile.error && (
                            <div
                              className="text-xs"
                              style={{ color: textMuted }}
                            >
                              <p>Hues: {parsedPaletteFile.hues.join(", ")}</p>
                              <p>
                                Shades: {parsedPaletteFile.shades.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-500">
                          ⚠️ No file - will generate NEW variableIds
                        </p>
                      )}
                    </div>

                    {/* light.tokens.json */}
                    <div
                      className="p-4 rounded"
                      style={{
                        backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                        border: figmaLightFile
                          ? "1px solid #22c55e"
                          : "1px solid #f59e0b",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">
                          light.tokens.json
                        </h4>
                        {parsedLightFile && !parsedLightFile.error && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500 bg-opacity-20 text-green-400">
                            {parsedLightFile.intents.length} intents,{" "}
                            {parsedLightFile.hues.length} hues
                          </span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) =>
                              handleLightFileUpload(ev.target.result);
                            reader.readAsText(file);
                          }
                        }}
                        className="text-xs mb-2"
                      />
                      {figmaLightFile ? (
                        <div className="space-y-1">
                          <p className="text-xs text-green-500">
                            ✓ File loaded - variableIds will be preserved
                          </p>
                          {parsedLightFile && !parsedLightFile.error && (
                            <div
                              className="text-xs"
                              style={{ color: textMuted }}
                            >
                              {parsedLightFile.intents.length > 0 && (
                                <p>
                                  Intents:{" "}
                                  {parsedLightFile.intents
                                    .map((i) => i.name)
                                    .join(", ")}
                                </p>
                              )}
                              {parsedLightFile.excluded.length > 0 && (
                                <p>
                                  Excluded:{" "}
                                  {parsedLightFile.excluded.join(", ")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-500">
                          ⚠️ No file - will generate NEW variableIds
                        </p>
                      )}
                    </div>

                    {/* dark.tokens.json */}
                    <div
                      className="p-4 rounded"
                      style={{
                        backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                        border: figmaDarkFile
                          ? "1px solid #22c55e"
                          : "1px solid #f59e0b",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">
                          dark.tokens.json
                        </h4>
                        {parsedDarkFile && !parsedDarkFile.error && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500 bg-opacity-20 text-green-400">
                            {parsedDarkFile.intents.length} intents,{" "}
                            {parsedDarkFile.hues.length} hues
                          </span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) =>
                              handleDarkFileUpload(ev.target.result);
                            reader.readAsText(file);
                          }
                        }}
                        className="text-xs mb-2"
                      />
                      {figmaDarkFile ? (
                        <p className="text-xs text-green-500">
                          ✓ File loaded - variableIds will be preserved
                        </p>
                      ) : (
                        <p className="text-xs text-amber-500">
                          ⚠️ No file - will generate NEW variableIds
                        </p>
                      )}
                    </div>
                  </div>
                </ConfigSection>

                {/* Figma Document Profile */}
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${
                      figmaColorProfile === "p3" ? "#22c55e" : borderColor
                    }`,
                  }}
                >
                  <h3 className="text-sm font-medium mb-2">
                    Figma Document Color Profile
                  </h3>
                  <p className="text-xs mb-3" style={{ color: textMuted }}>
                    Must match your Figma file's color profile (File → Color
                    Profile).
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFigmaColorProfile("srgb")}
                      className={`px-4 py-2 rounded text-sm ${
                        figmaColorProfile === "srgb"
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                      style={
                        figmaColorProfile !== "srgb"
                          ? {
                              backgroundColor: isDark ? "#333" : "#e5e5e5",
                              color: textColor,
                            }
                          : {}
                      }
                    >
                      sRGB
                    </button>
                    <button
                      onClick={() => setFigmaColorProfile("p3")}
                      className={`px-4 py-2 rounded text-sm ${
                        figmaColorProfile === "p3"
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                      style={
                        figmaColorProfile !== "p3"
                          ? {
                              backgroundColor: isDark ? "#333" : "#e5e5e5",
                              color: textColor,
                            }
                          : {}
                      }
                    >
                      Display P3 ✨
                    </button>
                  </div>
                  {figmaColorProfile === "p3" && (
                    <p className="text-xs mt-2 text-green-500">
                      ✓ Wide gamut colors preserved. Ensure Figma doc is set to
                      Display P3.
                    </p>
                  )}
                </div>

                {/* Export Type Selector */}
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <h3 className="text-sm font-medium mb-3">Export Type</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFigmaExportType("palette")}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        figmaExportType === "palette"
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                      style={
                        figmaExportType !== "palette"
                          ? {
                              backgroundColor: isDark ? "#333" : "#e5e5e5",
                              color: textColor,
                            }
                          : {}
                      }
                    >
                      palette.tokens.json
                    </button>
                    <button
                      onClick={() => setFigmaExportType("semantic")}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        figmaExportType !== "palette"
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                      style={
                        figmaExportType === "palette"
                          ? {
                              backgroundColor: isDark ? "#333" : "#e5e5e5",
                              color: textColor,
                            }
                          : {}
                      }
                    >
                      light + dark.tokens.json
                    </button>
                  </div>
                  {figmaExportType !== "palette" && (
                    <p className="text-xs mt-2" style={{ color: textMuted }}>
                      Both files share the same structure. Configure once,
                      export both.
                    </p>
                  )}
                </div>

                {/* Palette-specific config */}
                {figmaExportType === "palette" && (
                  <>
                    {/* Palette Variable Scopes */}
                    <ConfigSection
                      title="Variable Scopes"
                      description="Restrict where palette primitives can be applied in Figma"
                      isOpen={exportSections.paletteScopes || false}
                      onToggle={() => toggleSection("paletteScopes")}
                    >
                      <div className="space-y-3">
                        <p className="text-xs" style={{ color: textMuted }}>
                          Hide primitives from property pickers to enforce
                          semantic token usage.
                        </p>
                        <div className="space-y-2">
                          {[
                            {
                              value: "ALL_SCOPES",
                              label: "Show in all properties",
                              desc: "No restrictions",
                            },
                            {
                              value: "ALL_FILLS",
                              label: "All fills only",
                              desc: "Frame, shape, text",
                            },
                            {
                              value: "FRAME_FILL",
                              label: "Frame fill",
                              desc: "",
                            },
                            {
                              value: "SHAPE_FILL",
                              label: "Shape fill",
                              desc: "",
                            },
                            {
                              value: "TEXT_FILL",
                              label: "Text fill",
                              desc: "",
                            },
                            {
                              value: "STROKE_COLOR",
                              label: "Stroke",
                              desc: "",
                            },
                            {
                              value: "EFFECT_COLOR",
                              label: "Effects",
                              desc: "Shadows, etc.",
                            },
                          ].map((scope) => {
                            const isAll = scope.value === "ALL_SCOPES";
                            const isChecked = isAll
                              ? paletteScopes.includes("ALL_SCOPES")
                              : paletteScopes.includes(scope.value);
                            return (
                              <label
                                key={scope.value}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (isAll) {
                                      setPaletteScopes(
                                        e.target.checked ? ["ALL_SCOPES"] : []
                                      );
                                    } else {
                                      setPaletteScopes((prev) => {
                                        const filtered = prev.filter(
                                          (s) => s !== "ALL_SCOPES"
                                        );
                                        if (e.target.checked) {
                                          return [...filtered, scope.value];
                                        } else {
                                          return filtered.filter(
                                            (s) => s !== scope.value
                                          );
                                        }
                                      });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-xs">{scope.label}</span>
                                {scope.desc && (
                                  <span
                                    className="text-xs"
                                    style={{ color: textMuted }}
                                  >
                                    ({scope.desc})
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                        <div
                          className="mt-3 p-2 rounded text-xs"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          {paletteScopes.length === 0 ? (
                            <span className="text-green-500">
                              ✓ Hidden from all — designers must use semantic
                              tokens
                            </span>
                          ) : paletteScopes.includes("ALL_SCOPES") ? (
                            <span className="text-amber-500">
                              ⚠ Visible everywhere — consider restricting
                            </span>
                          ) : (
                            <span style={{ color: textMuted }}>
                              Visible in: {paletteScopes.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </ConfigSection>

                    <ConfigSection
                      title="Palette Mapping"
                      description={`Maps ${hues.length} hues × ${
                        stops.length
                      } shades = ${
                        hues.length * stops.length
                      } color primitives`}
                      isOpen={exportSections.paletteMapping}
                      onToggle={() => toggleSection("paletteMapping")}
                      badge={parsedPaletteFile ? "File loaded" : null}
                    >
                      {parsedPaletteFile && !parsedPaletteFile.error && (
                        <div className="space-y-6">
                          {/* Hue Mapping */}
                          <div>
                            <h4 className="text-xs font-medium mb-3">
                              Hue Mapping
                            </h4>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                              {Object.entries(hueMapping).map(
                                ([existingHue, machineHue]) => (
                                  <div
                                    key={existingHue}
                                    className="flex items-center gap-4 text-xs"
                                  >
                                    <span
                                      className="w-24 truncate font-mono"
                                      title={existingHue}
                                    >
                                      {existingHue}
                                    </span>
                                    <span style={{ color: textMuted }}>→</span>
                                    <select
                                      value={machineHue}
                                      onChange={(e) =>
                                        setHueMapping((prev) => ({
                                          ...prev,
                                          [existingHue]: e.target.value,
                                        }))
                                      }
                                      className="px-2 py-1 rounded border text-xs flex-1"
                                      style={inputStyle}
                                    >
                                      {hues.map((h) => (
                                        <option key={h.name} value={h.name}>
                                          {h.name}
                                        </option>
                                      ))}
                                      <option value={existingHue}>
                                        {existingHue} (keep)
                                      </option>
                                    </select>
                                    <span className="w-8 text-center flex-shrink-0">
                                      {existingHue.toLowerCase() ===
                                        machineHue.toLowerCase() ||
                                      (existingHue === "grey" &&
                                        machineHue === "gray") ? (
                                        <span className="text-green-500">
                                          ✓
                                        </span>
                                      ) : (
                                        <span className="text-amber-500">
                                          ⚠
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Shade comparison */}
                          <div>
                            <h4 className="text-xs font-medium mb-3">
                              Shade Comparison
                            </h4>
                            <div className="flex gap-4 text-xs">
                              <div>
                                <span style={{ color: textMuted }}>File: </span>
                                <span className="font-mono">
                                  {parsedPaletteFile.shades.join(", ")}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: textMuted }}>
                                  Machine:{" "}
                                </span>
                                <span className="font-mono">
                                  {stops.map((s) => s.name).join(", ")}
                                </span>
                              </div>
                            </div>
                            {/* Show new shades that will be created */}
                            {(() => {
                              const existingShades = new Set(
                                parsedPaletteFile.shades
                              );
                              const newShades = stops
                                .filter((s) => !existingShades.has(s.name))
                                .map((s) => s.name);
                              if (newShades.length > 0) {
                                return (
                                  <p className="text-xs text-amber-500 mt-1">
                                    ⚠ New shades will be created:{" "}
                                    {newShades.join(", ")}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Shade Migration */}
                          <div>
                            <h4 className="text-xs font-medium mb-3">
                              Shade Migration
                            </h4>
                            <p
                              className="text-xs mb-4"
                              style={{ color: textMuted }}
                            >
                              For each machine shade, choose which existing
                              Figma variable to use (preserving its ID) or
                              create new.
                            </p>
                            <div
                              className="rounded-lg overflow-hidden border"
                              style={{ borderColor: borderColor }}
                            >
                              <div
                                className="grid grid-cols-3 gap-4 p-3 text-xs font-medium"
                                style={{
                                  backgroundColor: isDark
                                    ? "#1a1a1a"
                                    : "#f5f5f5",
                                }}
                              >
                                <span>Machine Shade</span>
                                <span>Source Variable</span>
                                <span>Action</span>
                              </div>
                              <div>
                                {stops.map((stop, idx) => {
                                  const source =
                                    shadeSourceMap[stop.name] || "new";
                                  const isNew = source === "new";
                                  const isRename =
                                    !isNew && source !== stop.name;
                                  const isUpdate =
                                    !isNew && source === stop.name;

                                  // Check if this source is already used by another shade
                                  const sourceUsedElsewhere =
                                    !isNew &&
                                    Object.entries(shadeSourceMap).some(
                                      ([targetShade, srcShade]) =>
                                        srcShade === source &&
                                        targetShade !== stop.name
                                    );

                                  return (
                                    <div
                                      key={stop.name}
                                      className="grid grid-cols-3 gap-4 p-3 items-center text-xs"
                                      style={{
                                        borderTop:
                                          idx > 0
                                            ? `1px solid ${borderColor}`
                                            : "none",
                                      }}
                                    >
                                      <span className="font-mono font-medium">
                                        {stop.name}
                                      </span>
                                      <select
                                        value={source}
                                        onChange={(e) =>
                                          setShadeSourceMap((prev) => ({
                                            ...prev,
                                            [stop.name]: e.target.value,
                                          }))
                                        }
                                        className="px-2 py-1.5 rounded border text-xs"
                                        style={inputStyle}
                                      >
                                        <option value="new">— new —</option>
                                        {parsedPaletteFile.shades.map((s) => (
                                          <option key={s} value={s}>
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                      <span
                                        className={`flex items-center gap-1.5 ${
                                          isNew
                                            ? "text-green-500"
                                            : isRename
                                            ? "text-amber-500"
                                            : "text-blue-500"
                                        }`}
                                      >
                                        {isNew && (
                                          <>
                                            <Plus className="w-3.5 h-3.5" />{" "}
                                            Create
                                          </>
                                        )}
                                        {isRename && (
                                          <>
                                            <RefreshCw className="w-3.5 h-3.5" />{" "}
                                            Rename {source}→{stop.name}
                                          </>
                                        )}
                                        {isUpdate && (
                                          <>
                                            <Check className="w-3.5 h-3.5" />{" "}
                                            Update
                                          </>
                                        )}
                                        {sourceUsedElsewhere && (
                                          <span
                                            className="text-red-500 ml-2"
                                            title="This source is used multiple times!"
                                          >
                                            ⚠
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Summary */}
                            {(() => {
                              const newCount = Object.values(
                                shadeSourceMap
                              ).filter((v) => v === "new").length;
                              const renameCount = Object.entries(
                                shadeSourceMap
                              ).filter(
                                ([k, v]) => v !== "new" && v !== k
                              ).length;
                              const updateCount = Object.entries(
                                shadeSourceMap
                              ).filter(
                                ([k, v]) => v !== "new" && v === k
                              ).length;
                              const unusedFileShades =
                                parsedPaletteFile.shades.filter(
                                  (s) =>
                                    !Object.values(shadeSourceMap).includes(s)
                                );

                              return (
                                <div
                                  className="mt-4 space-y-2 text-xs"
                                  style={{ color: textMuted }}
                                >
                                  <p>
                                    <span className="text-green-500">
                                      {newCount} new
                                    </span>
                                    {" · "}
                                    <span className="text-amber-500">
                                      {renameCount} rename
                                    </span>
                                    {" · "}
                                    <span className="text-blue-500">
                                      {updateCount} update
                                    </span>
                                  </p>
                                  {unusedFileShades.length > 0 && (
                                    <p className="text-amber-500">
                                      ⚠ File shades not used:{" "}
                                      {unusedFileShades.join(", ")} — these
                                      variables will be orphaned
                                    </p>
                                  )}
                                  {newCount > 0 && (
                                    <p className="opacity-70">
                                      ℹ New variables may appear out of order in
                                      Figma. The API doesn't support sorting —
                                      manual reordering required.
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {!parsedPaletteFile && (
                        <p className="text-xs" style={{ color: textMuted }}>
                          Upload palette.tokens.json above to see mapping
                          options.
                        </p>
                      )}
                    </ConfigSection>
                  </>
                )}

                {/* Semantic tokens config (light/dark) */}
                {figmaExportType !== "palette" && (
                  <>
                    {/* Intent Colors */}
                    <ConfigSection
                      title="Intent Colors"
                      description={EXPORT_INFO.intents}
                      isOpen={exportSections.intents}
                      onToggle={() => toggleSection("intents")}
                    >
                      <div className="space-y-4">
                        {Object.entries(figmaIntentMap).map(
                          ([intent, hueName]) => (
                            <div
                              key={intent}
                              className="flex items-center gap-6"
                            >
                              <span className="text-xs w-24 font-medium">
                                {intent}
                              </span>
                              <select
                                value={hueName}
                                onChange={(e) =>
                                  setFigmaIntentMap((prev) => ({
                                    ...prev,
                                    [intent]: e.target.value,
                                  }))
                                }
                                className="px-3 py-1.5 rounded border text-xs flex-1"
                                style={inputStyle}
                              >
                                {hues.map((h) => (
                                  <option key={h.name} value={h.name}>
                                    {h.name}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-1.5 flex-shrink-0">
                                {palette
                                  .find((h) => h.name === hueName)
                                  ?.colors.filter((c) =>
                                    ["200", "500", "800"].includes(c.stop)
                                  )
                                  .map((c) => (
                                    <div
                                      key={c.stop}
                                      className="w-6 h-6 rounded"
                                      style={{ backgroundColor: c.hex }}
                                      title={`${hueName}-${c.stop}`}
                                    />
                                  ))}
                              </div>
                            </div>
                          )
                        )}
                        <div
                          className="flex items-center gap-6 pt-4 border-t"
                          style={{ borderColor: borderColor }}
                        >
                          <span className="text-xs w-24">Default shade:</span>
                          <select
                            value={figmaDefaultShade}
                            onChange={(e) =>
                              setFigmaDefaultShade(e.target.value)
                            }
                            className="px-3 py-1.5 rounded border text-xs"
                            style={inputStyle}
                          >
                            {stops.map((s) => (
                              <option key={s.name} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <span
                            className="text-xs"
                            style={{ color: textMuted }}
                          >
                            primary = primary-{figmaDefaultShade}
                          </span>
                        </div>
                      </div>
                    </ConfigSection>

                    {/* Theme Mapping - for shade migration */}
                    <ConfigSection
                      title="Theme Mapping"
                      description="Migrate theme shades while preserving variable IDs"
                      isOpen={exportSections.themeMapping}
                      onToggle={() => toggleSection("themeMapping")}
                      badge={parsedLightFile ? "File loaded" : null}
                    >
                      {parsedLightFile && !parsedLightFile.error ? (
                        <div className="space-y-6">
                          {/* Shade vs Alpha Detection */}
                          <div>
                            <h4 className="text-xs font-medium mb-3">
                              Detected Structure
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div>
                                <span style={{ color: textMuted }}>
                                  File shades (from /shade/ group):{" "}
                                </span>
                                <span className="font-mono">
                                  {[
                                    ...new Set(
                                      parsedLightFile.intents.flatMap(
                                        (i) => i.shades || []
                                      )
                                    ),
                                  ]
                                    .sort((a, b) => Number(a) - Number(b))
                                    .join(", ") || "none"}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: textMuted }}>
                                  Intent alphas (direct on intent):{" "}
                                </span>
                                <span className="font-mono">
                                  {[
                                    ...new Set(
                                      parsedLightFile.intents.flatMap(
                                        (i) => i.intentAlphas || []
                                      )
                                    ),
                                  ]
                                    .sort((a, b) => a - b)
                                    .join(", ") || "none"}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: textMuted }}>
                                  Palette shades (will be generated):{" "}
                                </span>
                                <span className="font-mono">
                                  {stops.map((s) => s.name).join(", ")}
                                </span>
                              </div>
                              {/* Warning if palette is missing standard shades */}
                              {(() => {
                                const standardShades = [
                                  "0",
                                  "50",
                                  "100",
                                  "200",
                                  "300",
                                  "400",
                                  "500",
                                  "600",
                                  "700",
                                  "800",
                                  "900",
                                  "950",
                                  "1000",
                                ];
                                const paletteShades = new Set(
                                  stops.map((s) => s.name)
                                );
                                const missingShades = standardShades.filter(
                                  (s) => !paletteShades.has(s)
                                );
                                if (missingShades.length > 0) {
                                  return (
                                    <div
                                      className="mt-2 p-2 rounded text-amber-500"
                                      style={{
                                        backgroundColor: isDark
                                          ? "#2a2a1a"
                                          : "#fefce8",
                                      }}
                                    >
                                      ⚠ Palette is missing standard shades:{" "}
                                      <span className="font-mono">
                                        {missingShades.join(", ")}
                                      </span>
                                      <br />
                                      <span style={{ color: textMuted }}>
                                        These will NOT be generated. Add them in
                                        the Palette tab if needed.
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

                          {/* Theme Shade Migration */}
                          <div>
                            <h4 className="text-xs font-medium mb-3">
                              Theme Shade Migration
                            </h4>
                            <p
                              className="text-xs mb-4"
                              style={{ color: textMuted }}
                            >
                              For each target shade, choose which existing theme
                              variable to migrate from (preserving its ID) or
                              create new.
                            </p>
                            <div
                              className="rounded-lg overflow-hidden border"
                              style={{ borderColor: borderColor }}
                            >
                              <div
                                className="grid grid-cols-3 gap-4 p-3 text-xs font-medium"
                                style={{
                                  backgroundColor: isDark
                                    ? "#1a1a1a"
                                    : "#f5f5f5",
                                }}
                              >
                                <span>Target Shade</span>
                                <span>Source Variable</span>
                                <span>Action</span>
                              </div>
                              <div>
                                {stops.map((stop, idx) => {
                                  const source =
                                    themeShadeSourceMap[stop.name] || "new";
                                  const isNew = source === "new";
                                  const isRename =
                                    !isNew && source !== stop.name;
                                  const isUpdate =
                                    !isNew && source === stop.name;

                                  // Get all unique shades from file (only from shade subgroup, not alphas)
                                  const fileShades = [
                                    ...new Set(
                                      parsedLightFile.intents.flatMap(
                                        (i) => i.shades || []
                                      )
                                    ),
                                  ].sort((a, b) => Number(a) - Number(b));

                                  // Check if this source is already used by another shade
                                  const sourceUsedElsewhere =
                                    !isNew &&
                                    Object.entries(themeShadeSourceMap).some(
                                      ([targetShade, srcShade]) =>
                                        srcShade === source &&
                                        targetShade !== stop.name
                                    );

                                  return (
                                    <div
                                      key={stop.name}
                                      className="grid grid-cols-3 gap-4 p-3 items-center text-xs"
                                      style={{
                                        borderTop:
                                          idx > 0
                                            ? `1px solid ${borderColor}`
                                            : "none",
                                      }}
                                    >
                                      <span className="font-mono font-medium">
                                        {stop.name}
                                      </span>
                                      <select
                                        value={source}
                                        onChange={(e) =>
                                          setThemeShadeSourceMap((prev) => ({
                                            ...prev,
                                            [stop.name]: e.target.value,
                                          }))
                                        }
                                        className="px-2 py-1.5 rounded border text-xs"
                                        style={inputStyle}
                                      >
                                        <option value="new">— new —</option>
                                        {fileShades.map((s) => (
                                          <option key={s} value={s}>
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                      <span
                                        className={`flex items-center gap-1.5 ${
                                          isNew
                                            ? "text-green-500"
                                            : isRename
                                            ? "text-amber-500"
                                            : "text-blue-500"
                                        }`}
                                      >
                                        {isNew && (
                                          <>
                                            <Plus className="w-3.5 h-3.5" />{" "}
                                            Create
                                          </>
                                        )}
                                        {isRename && (
                                          <>
                                            <RefreshCw className="w-3.5 h-3.5" />{" "}
                                            Rename {source}→{stop.name}
                                          </>
                                        )}
                                        {isUpdate && (
                                          <>
                                            <Check className="w-3.5 h-3.5" />{" "}
                                            Update
                                          </>
                                        )}
                                        {sourceUsedElsewhere && (
                                          <span
                                            className="text-red-500 ml-2"
                                            title="This source is used multiple times!"
                                          >
                                            ⚠
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Summary */}
                            {(() => {
                              const newCount = Object.values(
                                themeShadeSourceMap
                              ).filter((v) => v === "new").length;
                              const renameCount = Object.entries(
                                themeShadeSourceMap
                              ).filter(
                                ([k, v]) => v !== "new" && v !== k
                              ).length;
                              const updateCount = Object.entries(
                                themeShadeSourceMap
                              ).filter(
                                ([k, v]) => v !== "new" && v === k
                              ).length;
                              const fileShades = [
                                ...new Set(
                                  parsedLightFile.intents.flatMap(
                                    (i) => i.shades || []
                                  )
                                ),
                              ];
                              const unusedFileShades = fileShades.filter(
                                (s) =>
                                  !Object.values(themeShadeSourceMap).includes(
                                    s
                                  )
                              );

                              return (
                                <div
                                  className="mt-4 space-y-2 text-xs"
                                  style={{ color: textMuted }}
                                >
                                  <p>
                                    <span className="text-green-500">
                                      {newCount} new
                                    </span>
                                    {" · "}
                                    <span className="text-amber-500">
                                      {renameCount} rename
                                    </span>
                                    {" · "}
                                    <span className="text-blue-500">
                                      {updateCount} update
                                    </span>
                                  </p>
                                  {unusedFileShades.length > 0 && (
                                    <p className="text-amber-500">
                                      ⚠ File shades not used:{" "}
                                      {unusedFileShades.join(", ")} — these
                                      variables will be orphaned
                                    </p>
                                  )}
                                  {newCount > 0 && (
                                    <p className="opacity-70">
                                      ℹ New variables may appear out of order in
                                      Figma. The API doesn't support sorting —
                                      manual reordering required.
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs" style={{ color: textMuted }}>
                          <p>
                            Upload a light.tokens.json file to enable theme
                            shade migration.
                          </p>
                          <p className="mt-2">
                            This allows you to rename shades (e.g., 700→800)
                            while preserving variable IDs.
                          </p>
                        </div>
                      )}
                    </ConfigSection>

                    {/* Token Naming - placed early so names are configured before use */}
                    <ConfigSection
                      title="Token Naming"
                      description={EXPORT_INFO.naming}
                      isOpen={exportSections.naming}
                      onToggle={() => toggleSection("naming")}
                    >
                      <div className="space-y-6">
                        {/* Elevation Names */}
                        <div>
                          <h4 className="text-xs font-medium mb-4">
                            Elevation Names
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-32"
                                style={{ color: textMuted }}
                              >
                                Elevation 0 (base):
                              </span>
                              <input
                                type="text"
                                value={namingConfig.elevation0}
                                onChange={(e) =>
                                  setNamingConfig((prev) => ({
                                    ...prev,
                                    elevation0: e.target.value,
                                  }))
                                }
                                className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                                style={inputStyle}
                                placeholder="ground"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-32"
                                style={{ color: textMuted }}
                              >
                                Elevation 1 (raised):
                              </span>
                              <input
                                type="text"
                                value={namingConfig.elevation1}
                                onChange={(e) =>
                                  setNamingConfig((prev) => ({
                                    ...prev,
                                    elevation1: e.target.value,
                                  }))
                                }
                                className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                                style={inputStyle}
                                placeholder="ground1"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-32"
                                style={{ color: textMuted }}
                              >
                                Elevation 2 (highest):
                              </span>
                              <input
                                type="text"
                                value={namingConfig.elevation2}
                                onChange={(e) =>
                                  setNamingConfig((prev) => ({
                                    ...prev,
                                    elevation2: e.target.value,
                                  }))
                                }
                                className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                                style={inputStyle}
                                placeholder="ground2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Foreground Naming */}
                        <div>
                          <h4 className="text-xs font-medium mb-4">
                            Foreground Color Naming
                          </h4>
                          <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-3">
                              <span
                                className="text-xs"
                                style={{ color: textMuted }}
                              >
                                Position:
                              </span>
                              <select
                                value={namingConfig.foregroundPosition}
                                onChange={(e) =>
                                  setNamingConfig((prev) => ({
                                    ...prev,
                                    foregroundPosition: e.target.value,
                                  }))
                                }
                                className="px-3 py-1.5 rounded border text-xs"
                                style={inputStyle}
                              >
                                <option value="prefix">Prefix</option>
                                <option value="suffix">Suffix</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-xs"
                                style={{ color: textMuted }}
                              >
                                Figma path:
                              </span>
                              <input
                                type="text"
                                value={namingConfig.foregroundModifier}
                                onChange={(e) =>
                                  setNamingConfig((prev) => ({
                                    ...prev,
                                    foregroundModifier: e.target.value,
                                  }))
                                }
                                className="px-3 py-1.5 rounded border text-xs w-20 font-mono"
                                style={inputStyle}
                                placeholder="on/"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-xs"
                                style={{ color: textMuted }}
                              >
                                Code syntax:
                              </span>
                              <input
                                type="text"
                                value={namingConfig.foregroundSyntax}
                                onChange={(e) =>
                                  setNamingConfig((prev) => ({
                                    ...prev,
                                    foregroundSyntax: e.target.value,
                                  }))
                                }
                                className="px-3 py-1.5 rounded border text-xs w-20 font-mono"
                                style={inputStyle}
                                placeholder="on-"
                              />
                            </div>
                          </div>
                          <div
                            className="mt-4 p-3 rounded text-xs font-mono"
                            style={{
                              backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                            }}
                          >
                            <div className="flex gap-6">
                              <div>
                                <span style={{ color: textMuted }}>
                                  Figma path:{" "}
                                </span>
                                {namingConfig.foregroundPosition ===
                                "prefix" ? (
                                  <>
                                    <span className="text-blue-400">
                                      {namingConfig.foregroundModifier}
                                    </span>
                                    primary
                                  </>
                                ) : (
                                  <>
                                    primary
                                    <span className="text-blue-400">
                                      {namingConfig.foregroundModifier}
                                    </span>
                                  </>
                                )}
                                {namingConfig.foregroundModifier.endsWith(
                                  "/"
                                ) && (
                                  <span style={{ color: textMuted }}>
                                    {" "}
                                    (nested)
                                  </span>
                                )}
                              </div>
                              <div>
                                <span style={{ color: textMuted }}>
                                  Code syntax:{" "}
                                </span>
                                <span className="text-green-400">
                                  {namingConfig.foregroundSyntax}
                                </span>
                                primary
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shade Group Name */}
                        <div>
                          <h4 className="text-xs font-medium mb-4">
                            Shade Group Name
                          </h4>
                          <div className="flex items-center gap-4">
                            <span
                              className="text-xs"
                              style={{ color: textMuted }}
                            >
                              Group name:
                            </span>
                            <input
                              type="text"
                              value={namingConfig.shadeGroupName}
                              onChange={(e) =>
                                setNamingConfig((prev) => ({
                                  ...prev,
                                  shadeGroupName: e.target.value,
                                }))
                              }
                              className="px-3 py-1.5 rounded border text-xs w-32 font-mono"
                              style={inputStyle}
                              placeholder="shade"
                            />
                            <span
                              className="text-xs"
                              style={{ color: textMuted }}
                            >
                              (empty = flat structure)
                            </span>
                          </div>
                          <div
                            className="mt-4 p-3 rounded text-xs font-mono"
                            style={{
                              backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                            }}
                          >
                            <span style={{ color: textMuted }}>Preview: </span>
                            {namingConfig.shadeGroupName ? (
                              <>
                                primary/
                                <span className="text-blue-400">
                                  {namingConfig.shadeGroupName}
                                </span>
                                /500
                              </>
                            ) : (
                              <>primary/500</>
                            )}
                          </div>
                        </div>
                      </div>
                    </ConfigSection>

                    {/* Ground Colors */}
                    <ConfigSection
                      title="Ground Colors (Elevation)"
                      description={EXPORT_INFO.ground}
                      isOpen={exportSections.ground}
                      onToggle={() => toggleSection("ground")}
                    >
                      <div className="space-y-6">
                        {/* Light Mode - always uses light styling */}
                        <div
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: "#fafafa",
                            color: "#1a1a1a",
                          }}
                        >
                          <h4
                            className="text-xs font-medium mb-4 flex items-center gap-2"
                            style={{ color: "#1a1a1a" }}
                          >
                            <Sun className="w-3.5 h-3.5" /> Light Mode
                          </h4>
                          <div className="space-y-4">
                            {["ground", "ground1", "ground2"].map((g, idx) => {
                              const refType = groundRefType.light[g];
                              const shadeVal = figmaGroundLight[g];
                              const customVal = groundCustomColors.light[g];
                              // Light mode input styling
                              const lightInputStyle = {
                                backgroundColor: "#fff",
                                color: "#1a1a1a",
                                borderColor: "#d4d4d4",
                              };
                              return (
                                <div
                                  key={g}
                                  className="flex items-center gap-4"
                                >
                                  <span
                                    className="text-xs w-20 font-medium"
                                    style={{ color: "#1a1a1a" }}
                                  >
                                    {namingConfig[`elevation${idx}`] || g}
                                  </span>
                                  <select
                                    value={refType}
                                    onChange={(e) => {
                                      setGroundRefType((prev) => ({
                                        ...prev,
                                        light: {
                                          ...prev.light,
                                          [g]: e.target.value,
                                        },
                                      }));
                                      if (
                                        e.target.value === "custom" &&
                                        !customVal
                                      ) {
                                        setGroundCustomColors((prev) => ({
                                          ...prev,
                                          light: {
                                            ...prev.light,
                                            [g]: "oklch(100% 0 0)",
                                          },
                                        }));
                                      }
                                    }}
                                    className="px-2 py-1 rounded border text-xs w-24"
                                    style={lightInputStyle}
                                  >
                                    <option value="primitive">Primitive</option>
                                    <option value="theme">Theme</option>
                                    <option value="custom">Custom</option>
                                  </select>
                                  {refType === "primitive" && (
                                    <select
                                      value={shadeVal}
                                      onChange={(e) =>
                                        setFigmaGroundLight((prev) => ({
                                          ...prev,
                                          [g]: e.target.value,
                                        }))
                                      }
                                      className="px-2 py-1 rounded border text-xs flex-1"
                                      style={lightInputStyle}
                                    >
                                      {stops.map((s) => (
                                        <option key={s.name} value={s.name}>
                                          gray-{s.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  {refType === "theme" && (
                                    <select
                                      value={shadeVal}
                                      onChange={(e) =>
                                        setFigmaGroundLight((prev) => ({
                                          ...prev,
                                          [g]: e.target.value,
                                        }))
                                      }
                                      className="px-2 py-1 rounded border text-xs flex-1"
                                      style={lightInputStyle}
                                    >
                                      {stops.map((s) => (
                                        <option key={s.name} value={s.name}>
                                          neutral-{s.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  {refType === "custom" && (
                                    <input
                                      type="text"
                                      value={customVal || "oklch(100% 0 0)"}
                                      onChange={(e) =>
                                        setGroundCustomColors((prev) => ({
                                          ...prev,
                                          light: {
                                            ...prev.light,
                                            [g]: e.target.value,
                                          },
                                        }))
                                      }
                                      className="px-2 py-1 rounded border text-xs font-mono flex-1"
                                      style={lightInputStyle}
                                      placeholder="oklch(100% 0 0)"
                                    />
                                  )}
                                  <div
                                    className="w-7 h-7 rounded border flex-shrink-0"
                                    style={{
                                      backgroundColor: (() => {
                                        if (refType === "custom") {
                                          // For custom, try to parse OKLCH and show approximate color
                                          const match = (customVal || "").match(
                                            /oklch\(\s*([\d.]+)%/i
                                          );
                                          if (match) {
                                            const L =
                                              parseFloat(match[1]) / 100;
                                            const gray = Math.round(L * 255);
                                            return `rgb(${gray},${gray},${gray})`;
                                          }
                                          return "#fff";
                                        }
                                        // For primitive or theme, look up in palette (no inversion needed for light mode)
                                        const neutralHue =
                                          figmaIntentMap.neutral || "gray";
                                        const hueSet = palette.find(
                                          (h) => h.name === neutralHue
                                        );
                                        return (
                                          hueSet?.colors.find(
                                            (c) => c.stop === shadeVal
                                          )?.hex || "#fff"
                                        );
                                      })(),
                                      borderColor: "#d4d4d4",
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Dark Mode - always uses dark styling */}
                        <div
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: "#1a1a1a",
                            color: "#e5e5e5",
                          }}
                        >
                          <h4
                            className="text-xs font-medium mb-4 flex items-center gap-2"
                            style={{ color: "#e5e5e5" }}
                          >
                            <Moon className="w-3.5 h-3.5" /> Dark Mode
                          </h4>
                          <div className="space-y-4">
                            {["ground", "ground1", "ground2"].map((g, idx) => {
                              const refType = groundRefType.dark[g];
                              const shadeVal = figmaGroundDark[g];
                              const customVal = groundCustomColors.dark[g];
                              // Dark mode input styling
                              const darkInputStyle = {
                                backgroundColor: "#262626",
                                color: "#e5e5e5",
                                borderColor: "#404040",
                              };
                              return (
                                <div
                                  key={g}
                                  className="flex items-center gap-4"
                                >
                                  <span
                                    className="text-xs w-20 font-medium"
                                    style={{ color: "#e5e5e5" }}
                                  >
                                    {namingConfig[`elevation${idx}`] || g}
                                  </span>
                                  <select
                                    value={refType}
                                    onChange={(e) => {
                                      setGroundRefType((prev) => ({
                                        ...prev,
                                        dark: {
                                          ...prev.dark,
                                          [g]: e.target.value,
                                        },
                                      }));
                                      if (
                                        e.target.value === "custom" &&
                                        !customVal
                                      ) {
                                        setGroundCustomColors((prev) => ({
                                          ...prev,
                                          dark: {
                                            ...prev.dark,
                                            [g]: "oklch(25% 0 0)",
                                          },
                                        }));
                                      }
                                    }}
                                    className="px-2 py-1 rounded border text-xs w-24"
                                    style={darkInputStyle}
                                  >
                                    <option value="primitive">Primitive</option>
                                    <option value="theme">Theme</option>
                                    <option value="custom">Custom</option>
                                  </select>
                                  {refType === "primitive" && (
                                    <select
                                      value={shadeVal}
                                      onChange={(e) =>
                                        setFigmaGroundDark((prev) => ({
                                          ...prev,
                                          [g]: e.target.value,
                                        }))
                                      }
                                      className="px-2 py-1 rounded border text-xs flex-1"
                                      style={darkInputStyle}
                                    >
                                      {stops.map((s) => (
                                        <option key={s.name} value={s.name}>
                                          gray-{s.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  {refType === "theme" && (
                                    <select
                                      value={shadeVal}
                                      onChange={(e) =>
                                        setFigmaGroundDark((prev) => ({
                                          ...prev,
                                          [g]: e.target.value,
                                        }))
                                      }
                                      className="px-2 py-1 rounded border text-xs flex-1"
                                      style={darkInputStyle}
                                    >
                                      {stops.map((s) => (
                                        <option key={s.name} value={s.name}>
                                          neutral-{s.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                  {refType === "custom" && (
                                    <input
                                      type="text"
                                      value={customVal || "oklch(25% 0 0)"}
                                      onChange={(e) =>
                                        setGroundCustomColors((prev) => ({
                                          ...prev,
                                          dark: {
                                            ...prev.dark,
                                            [g]: e.target.value,
                                          },
                                        }))
                                      }
                                      className="px-2 py-1 rounded border text-xs font-mono flex-1"
                                      style={darkInputStyle}
                                      placeholder="oklch(25% 0 0)"
                                    />
                                  )}
                                  <div
                                    className="w-7 h-7 rounded border flex-shrink-0"
                                    style={{
                                      backgroundColor: (() => {
                                        if (refType === "custom") {
                                          // For custom, try to parse OKLCH and show approximate color
                                          const match = (customVal || "").match(
                                            /oklch\(\s*([\d.]+)%/i
                                          );
                                          if (match) {
                                            const L =
                                              parseFloat(match[1]) / 100;
                                            const gray = Math.round(L * 255);
                                            return `rgb(${gray},${gray},${gray})`;
                                          }
                                          return "#222";
                                        }
                                        // For primitive or theme, look up in palette
                                        const neutralHue =
                                          figmaIntentMap.neutral || "gray";
                                        const hueSet = palette.find(
                                          (h) => h.name === neutralHue
                                        );
                                        if (!hueSet) return "#222";

                                        // For dark mode theme references, we need to show the INVERTED shade
                                        // because neutral-0 in dark mode actually displays as the darkest color
                                        let lookupShade = shadeVal;
                                        if (refType === "theme") {
                                          // Invert: 0↔1000, 50↔950, 100↔900, etc.
                                          const shadeNum = parseInt(shadeVal);
                                          const invertedNum = 1000 - shadeNum;
                                          // Find closest valid shade
                                          const validShades = hueSet.colors.map(
                                            (c) => parseInt(c.stop)
                                          );
                                          const closest = validShades.reduce(
                                            (prev, curr) =>
                                              Math.abs(curr - invertedNum) <
                                              Math.abs(prev - invertedNum)
                                                ? curr
                                                : prev
                                          );
                                          lookupShade = closest.toString();
                                        }

                                        return (
                                          hueSet.colors.find(
                                            (c) => c.stop === lookupShade
                                          )?.hex || "#222"
                                        );
                                      })(),
                                      borderColor: "#404040",
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <p className="text-xs" style={{ color: textMuted }}>
                          <strong>Primitive:</strong> References palette
                          collection (gray-X)
                          <br />
                          <strong>Theme:</strong> References theme collection
                          (neutral-X) — mode-aware
                          <br />
                          <strong>Custom:</strong> Direct OKLCH value
                        </p>
                      </div>
                    </ConfigSection>

                    {/* On-Colors */}
                    <ConfigSection
                      title="On-Colors (Foreground)"
                      description={EXPORT_INFO.onColors}
                      isOpen={exportSections.onColors}
                      onToggle={() => toggleSection("onColors")}
                    >
                      <div className="space-y-6">
                        <div className="flex items-center gap-6">
                          <span className="text-xs w-36">
                            Contrast threshold:
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={onColorThreshold}
                            onChange={(e) =>
                              setOnColorThreshold(Number(e.target.value))
                            }
                            className="w-20 px-3 py-1.5 rounded border text-xs text-center"
                            style={inputStyle}
                          />
                          <span
                            className="text-xs"
                            style={{ color: textMuted }}
                          >
                            % luminance threshold
                          </span>
                        </div>

                        {/* APCA Hint */}
                        <div
                          className="p-3 rounded-lg text-xs"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          <p className="mb-2">
                            <strong>APCA Contrast Guide:</strong>
                          </p>
                          <div
                            className="grid grid-cols-2 gap-2"
                            style={{ color: textMuted }}
                          >
                            <div>• Lc 90+ — Body text (16px regular)</div>
                            <div>
                              • Lc 75+ — Large text (24px+, or 18px bold)
                            </div>
                            <div>• Lc 60+ — Headlines (32px+)</div>
                            <div>• Lc 45+ — Subheadings, large icons</div>
                            <div>• Lc 30+ — Placeholders, disabled text</div>
                            <div>• Lc 15+ — Dividers, non-text UI</div>
                          </div>
                          <a
                            href="https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline mt-2 inline-block"
                          >
                            Learn more about APCA →
                          </a>
                        </div>

                        {/* On-color preview - full shade set */}
                        <div>
                          <h4 className="text-xs font-medium mb-3">
                            Preview — All Shades
                          </h4>
                          <p
                            className="text-xs mb-4"
                            style={{ color: textMuted }}
                          >
                            Shows which foreground (black/white) will be used
                            for each shade. Background follows the app theme.
                          </p>
                          <div className="space-y-4">
                            {Object.entries(figmaIntentMap).map(
                              ([intent, hueName]) => {
                                const hueSet = palette.find(
                                  (h) => h.name === hueName
                                );
                                if (!hueSet) return null;
                                const fgName =
                                  namingConfig.foregroundPosition === "prefix"
                                    ? `${namingConfig.foregroundModifier}${intent}`
                                    : `${intent}${namingConfig.foregroundModifier}`;
                                return (
                                  <div
                                    key={intent}
                                    className="flex items-center gap-3"
                                  >
                                    <span className="text-xs w-24 font-medium">
                                      {fgName}
                                    </span>
                                    <div className="flex gap-0.5">
                                      {hueSet.colors.map((color) => {
                                        const L =
                                          (0.2126 *
                                            parseInt(
                                              color.hex.slice(1, 3),
                                              16
                                            )) /
                                            255 +
                                          (0.7152 *
                                            parseInt(
                                              color.hex.slice(3, 5),
                                              16
                                            )) /
                                            255 +
                                          (0.0722 *
                                            parseInt(
                                              color.hex.slice(5, 7),
                                              16
                                            )) /
                                            255;
                                        const useBlack =
                                          L > onColorThreshold / 100;
                                        return (
                                          <div
                                            key={color.stop}
                                            className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold"
                                            style={{
                                              backgroundColor: color.hex,
                                              color: useBlack ? "#000" : "#fff",
                                            }}
                                            title={`${intent}-${color.stop}: ${
                                              useBlack ? "black" : "white"
                                            }`}
                                          >
                                            {useBlack ? "B" : "W"}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                          <div
                            className="flex gap-4 mt-4 text-xs"
                            style={{ color: textMuted }}
                          >
                            <span>
                              Shades: {stops.map((s) => s.name).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </ConfigSection>

                    {/* Stark */}
                    <ConfigSection
                      title="Stark Shades"
                      description="Full stark shade scale for both themes. Used for maximum contrast text, buttons, and UI. Edit OKLCH values for each shade."
                      isOpen={exportSections.stark}
                      onToggle={() => toggleSection("stark")}
                    >
                      <div className="space-y-6">
                        <p className="text-xs" style={{ color: textMuted }}>
                          Stark palettes have unique generation patterns. Light
                          mode typically goes white→black, dark mode
                          black→white. The default shade (used for alpha
                          variations) is configurable.
                        </p>

                        {/* Default shade selector */}
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-medium">
                            Default stark shade (for alphas):
                          </span>
                          <select
                            value={starkDefaultShade.light}
                            onChange={(e) =>
                              setStarkDefaultShade((prev) => ({
                                ...prev,
                                light: e.target.value,
                                dark: e.target.value,
                              }))
                            }
                            className="px-2 py-1 rounded border text-xs"
                            style={inputStyle}
                          >
                            {Object.keys(starkShades.light).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Light Mode Stark */}
                          <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: "#fafafa" }}
                          >
                            <h5
                              className="text-xs font-medium mb-3 flex items-center gap-2"
                              style={{ color: "#1a1a1a" }}
                            >
                              <Sun className="w-3 h-3" /> Light Mode
                            </h5>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                              {Object.entries(starkShades.light).map(
                                ([shade, oklch]) => {
                                  const match =
                                    oklch.match(/oklch\(\s*([\d.]+)%/i);
                                  const L = match
                                    ? parseFloat(match[1]) / 100
                                    : 0.5;
                                  const gray = Math.round(L * 255);
                                  const previewColor = `rgb(${gray},${gray},${gray})`;
                                  return (
                                    <div
                                      key={shade}
                                      className="flex items-center gap-2"
                                    >
                                      <span
                                        className="text-xs w-10 font-mono"
                                        style={{ color: "#666" }}
                                      >
                                        {shade}
                                      </span>
                                      <input
                                        type="text"
                                        value={oklch}
                                        onChange={(e) =>
                                          setStarkShades((prev) => ({
                                            ...prev,
                                            light: {
                                              ...prev.light,
                                              [shade]: e.target.value,
                                            },
                                          }))
                                        }
                                        className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                        style={{
                                          backgroundColor: "#fff",
                                          color: "#1a1a1a",
                                          borderColor: "#d4d4d4",
                                        }}
                                      />
                                      <div
                                        className="w-6 h-6 rounded border"
                                        style={{
                                          backgroundColor: previewColor,
                                          borderColor: "#d4d4d4",
                                        }}
                                      />
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>

                          {/* Dark Mode Stark */}
                          <div
                            className="p-4 rounded-lg"
                            style={{ backgroundColor: "#1a1a1a" }}
                          >
                            <h5
                              className="text-xs font-medium mb-3 flex items-center gap-2"
                              style={{ color: "#e5e5e5" }}
                            >
                              <Moon className="w-3 h-3" /> Dark Mode
                            </h5>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                              {Object.entries(starkShades.dark).map(
                                ([shade, oklch]) => {
                                  const match =
                                    oklch.match(/oklch\(\s*([\d.]+)%/i);
                                  const L = match
                                    ? parseFloat(match[1]) / 100
                                    : 0.5;
                                  const gray = Math.round(L * 255);
                                  const previewColor = `rgb(${gray},${gray},${gray})`;
                                  return (
                                    <div
                                      key={shade}
                                      className="flex items-center gap-2"
                                    >
                                      <span
                                        className="text-xs w-10 font-mono"
                                        style={{ color: "#888" }}
                                      >
                                        {shade}
                                      </span>
                                      <input
                                        type="text"
                                        value={oklch}
                                        onChange={(e) =>
                                          setStarkShades((prev) => ({
                                            ...prev,
                                            dark: {
                                              ...prev.dark,
                                              [shade]: e.target.value,
                                            },
                                          }))
                                        }
                                        className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                        style={{
                                          backgroundColor: "#262626",
                                          color: "#e5e5e5",
                                          borderColor: "#404040",
                                        }}
                                      />
                                      <div
                                        className="w-6 h-6 rounded border"
                                        style={{
                                          backgroundColor: previewColor,
                                          borderColor: "#404040",
                                        }}
                                      />
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Preview strip */}
                        <div className="flex gap-4">
                          <div>
                            <span
                              className="text-xs"
                              style={{ color: textMuted }}
                            >
                              Light:
                            </span>
                            <div className="flex gap-0.5 mt-1">
                              {Object.entries(starkShades.light).map(
                                ([shade, oklch]) => {
                                  const match =
                                    oklch.match(/oklch\(\s*([\d.]+)%/i);
                                  const L = match
                                    ? parseFloat(match[1]) / 100
                                    : 0.5;
                                  const gray = Math.round(L * 255);
                                  return (
                                    <div
                                      key={shade}
                                      className="w-4 h-4 rounded-sm"
                                      style={{
                                        backgroundColor: `rgb(${gray},${gray},${gray})`,
                                      }}
                                      title={shade}
                                    />
                                  );
                                }
                              )}
                            </div>
                          </div>
                          <div>
                            <span
                              className="text-xs"
                              style={{ color: textMuted }}
                            >
                              Dark:
                            </span>
                            <div className="flex gap-0.5 mt-1">
                              {Object.entries(starkShades.dark).map(
                                ([shade, oklch]) => {
                                  const match =
                                    oklch.match(/oklch\(\s*([\d.]+)%/i);
                                  const L = match
                                    ? parseFloat(match[1]) / 100
                                    : 0.5;
                                  const gray = Math.round(L * 255);
                                  return (
                                    <div
                                      key={shade}
                                      className="w-4 h-4 rounded-sm"
                                      style={{
                                        backgroundColor: `rgb(${gray},${gray},${gray})`,
                                      }}
                                      title={shade}
                                    />
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ConfigSection>

                    {/* Alpha Variations */}
                    <ConfigSection
                      title="Alpha Variations"
                      description="Configure alpha/opacity variations for different token categories. Format: primary/50 means 50% opacity."
                      isOpen={exportSections.alphas}
                      onToggle={() => toggleSection("alphas")}
                    >
                      <div className="space-y-6">
                        {/* Hint and Reset */}
                        <div
                          className="flex items-start justify-between gap-4 p-3 rounded-lg"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f0f7ff",
                            border: `1px solid ${isDark ? "#333" : "#cce0ff"}`,
                          }}
                        >
                          <div className="text-xs" style={{ color: textMuted }}>
                            <strong style={{ color: textColor }}>
                              Auto-sync from JSON:
                            </strong>{" "}
                            When you load a theme JSON file, alpha values are
                            extracted from existing tokens. For example, if{" "}
                            <code
                              className="px-1 py-0.5 rounded"
                              style={{
                                backgroundColor: isDark ? "#333" : "#e0e0e0",
                              }}
                            >
                              primary/500/60
                            </code>{" "}
                            exists, "60" is added to semantic shade 500 alphas.
                          </div>
                          <button
                            onClick={() => setAlphaConfig(DEFAULT_ALPHA_CONFIG)}
                            className="flex items-center gap-1 px-2 py-1 text-xs rounded shrink-0"
                            style={{
                              backgroundColor: isDark ? "#333" : "#e0e0e0",
                              color: textColor,
                            }}
                            title="Reset to default values"
                          >
                            <RotateCcw size={12} />
                            Reset
                          </button>
                        </div>

                        {/* Grounds */}
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          <h5 className="text-xs font-semibold mb-3">
                            Grounds
                          </h5>
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-36"
                                style={{ color: textMuted }}
                              >
                                ground, ground1, ground2
                              </span>
                              <input
                                type="text"
                                value={alphaConfig.ground}
                                onChange={(e) =>
                                  setAlphaConfig((prev) => ({
                                    ...prev,
                                    ground: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                style={inputStyle}
                              />
                              <span
                                className="text-xs w-12 text-right tabular-nums"
                                style={{ color: textMuted }}
                              >
                                {parseAlphaString(alphaConfig.ground).length}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-36"
                                style={{ color: textMuted }}
                              >
                                on-ground
                              </span>
                              <input
                                type="text"
                                value={alphaConfig.onGround}
                                onChange={(e) =>
                                  setAlphaConfig((prev) => ({
                                    ...prev,
                                    onGround: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                style={inputStyle}
                              />
                              <span
                                className="text-xs w-12 text-right tabular-nums"
                                style={{ color: textMuted }}
                              >
                                {parseAlphaString(alphaConfig.onGround).length}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stark */}
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          <h5 className="text-xs font-semibold mb-3">Stark</h5>
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-36"
                                style={{ color: textMuted }}
                              >
                                stark
                              </span>
                              <input
                                type="text"
                                value={alphaConfig.stark}
                                onChange={(e) =>
                                  setAlphaConfig((prev) => ({
                                    ...prev,
                                    stark: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                style={inputStyle}
                              />
                              <span
                                className="text-xs w-12 text-right tabular-nums"
                                style={{ color: textMuted }}
                              >
                                {parseAlphaString(alphaConfig.stark).length}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-36"
                                style={{ color: textMuted }}
                              >
                                on-stark
                              </span>
                              <input
                                type="text"
                                value={alphaConfig.onStark}
                                onChange={(e) =>
                                  setAlphaConfig((prev) => ({
                                    ...prev,
                                    onStark: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                style={inputStyle}
                              />
                              <span
                                className="text-xs w-12 text-right tabular-nums"
                                style={{ color: textMuted }}
                              >
                                {parseAlphaString(alphaConfig.onStark).length}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Black/White */}
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          <h5 className="text-xs font-semibold mb-3">
                            Black, White
                          </h5>
                          <div className="flex items-center gap-4">
                            <span
                              className="text-xs w-36"
                              style={{ color: textMuted }}
                            >
                              black, white
                            </span>
                            <input
                              type="text"
                              value={alphaConfig.blackWhite}
                              onChange={(e) =>
                                setAlphaConfig((prev) => ({
                                  ...prev,
                                  blackWhite: e.target.value,
                                }))
                              }
                              className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                              style={inputStyle}
                            />
                            <span
                              className="text-xs w-12 text-right tabular-nums"
                              style={{ color: textMuted }}
                            >
                              {parseAlphaString(alphaConfig.blackWhite).length}
                            </span>
                          </div>
                        </div>

                        {/* Semantic Intents */}
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          <h5 className="text-xs font-semibold mb-3">
                            Semantic Intents{" "}
                            <span
                              style={{ color: textMuted, fontWeight: "normal" }}
                            >
                              (primary, danger, warning, success, neutral)
                            </span>
                          </h5>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-36"
                                style={{ color: textMuted }}
                              >
                                semantic
                              </span>
                              <input
                                type="text"
                                value={alphaConfig.semanticDefault}
                                onChange={(e) =>
                                  setAlphaConfig((prev) => ({
                                    ...prev,
                                    semanticDefault: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                style={inputStyle}
                              />
                              <span
                                className="text-xs w-12 text-right tabular-nums"
                                style={{ color: textMuted }}
                              >
                                {
                                  parseAlphaString(alphaConfig.semanticDefault)
                                    .length
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-36"
                                style={{ color: textMuted }}
                              >
                                on-semantic
                              </span>
                              <input
                                type="text"
                                value={alphaConfig.onSemanticDefault}
                                onChange={(e) =>
                                  setAlphaConfig((prev) => ({
                                    ...prev,
                                    onSemanticDefault: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                style={inputStyle}
                              />
                              <span
                                className="text-xs w-12 text-right tabular-nums"
                                style={{ color: textMuted }}
                              >
                                {
                                  parseAlphaString(
                                    alphaConfig.onSemanticDefault
                                  ).length
                                }
                              </span>
                            </div>

                            {/* Per-shade alphas */}
                            <div
                              className="mt-3 pt-3"
                              style={{ borderTop: `1px solid ${borderColor}` }}
                            >
                              <span className="text-xs font-medium">
                                Shades
                              </span>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                                {Object.entries(
                                  alphaConfig.semanticShades || {}
                                ).map(([shade, alphas]) => (
                                  <div
                                    key={shade}
                                    className="flex items-center gap-2"
                                  >
                                    <span
                                      className="text-xs w-14 font-mono"
                                      style={{ color: textMuted }}
                                    >
                                      {shade}
                                    </span>
                                    <input
                                      type="text"
                                      value={alphas}
                                      onChange={(e) =>
                                        setAlphaConfig((prev) => ({
                                          ...prev,
                                          semanticShades: {
                                            ...prev.semanticShades,
                                            [shade]: e.target.value,
                                          },
                                        }))
                                      }
                                      className="flex-1 px-2 py-0.5 rounded border text-xs font-mono"
                                      style={inputStyle}
                                      placeholder="e.g. 10,50,80"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Per-on-shade alphas */}
                            <div
                              className="mt-3 pt-3"
                              style={{ borderTop: `1px solid ${borderColor}` }}
                            >
                              <span className="text-xs font-medium">
                                On-Shades
                              </span>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                                {Object.entries(
                                  alphaConfig.onSemanticShades || {}
                                ).map(([shade, alphas]) => (
                                  <div
                                    key={shade}
                                    className="flex items-center gap-2"
                                  >
                                    <span
                                      className="text-xs w-14 font-mono"
                                      style={{ color: textMuted }}
                                    >
                                      on-{shade}
                                    </span>
                                    <input
                                      type="text"
                                      value={alphas}
                                      onChange={(e) =>
                                        setAlphaConfig((prev) => ({
                                          ...prev,
                                          onSemanticShades: {
                                            ...prev.onSemanticShades,
                                            [shade]: e.target.value,
                                          },
                                        }))
                                      }
                                      className="flex-1 px-2 py-0.5 rounded border text-xs font-mono"
                                      style={inputStyle}
                                      placeholder="e.g. 10,50,80"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Primitive Intents */}
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          <h5 className="text-xs font-semibold mb-3">
                            Primitive Intents{" "}
                            <span
                              style={{ color: textMuted, fontWeight: "normal" }}
                            >
                              (palette hues: blue, gray, red, etc.)
                            </span>
                          </h5>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-36"
                                style={{ color: textMuted }}
                              >
                                primitive
                              </span>
                              <input
                                type="text"
                                value={alphaConfig.primitiveDefault}
                                onChange={(e) =>
                                  setAlphaConfig((prev) => ({
                                    ...prev,
                                    primitiveDefault: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                style={inputStyle}
                                placeholder="empty = none"
                              />
                              <span
                                className="text-xs w-12 text-right tabular-nums"
                                style={{ color: textMuted }}
                              >
                                {
                                  parseAlphaString(alphaConfig.primitiveDefault)
                                    .length
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className="text-xs w-36"
                                style={{ color: textMuted }}
                              >
                                on-primitive
                              </span>
                              <input
                                type="text"
                                value={alphaConfig.onPrimitiveDefault}
                                onChange={(e) =>
                                  setAlphaConfig((prev) => ({
                                    ...prev,
                                    onPrimitiveDefault: e.target.value,
                                  }))
                                }
                                className="flex-1 px-2 py-1 rounded border text-xs font-mono"
                                style={inputStyle}
                                placeholder="empty = none"
                              />
                              <span
                                className="text-xs w-12 text-right tabular-nums"
                                style={{ color: textMuted }}
                              >
                                {
                                  parseAlphaString(
                                    alphaConfig.onPrimitiveDefault
                                  ).length
                                }
                              </span>
                            </div>

                            {/* Per-shade alphas */}
                            <div
                              className="mt-3 pt-3"
                              style={{ borderTop: `1px solid ${borderColor}` }}
                            >
                              <span className="text-xs font-medium">
                                Shades
                              </span>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                                {Object.entries(
                                  alphaConfig.primitiveShades || {}
                                ).map(([shade, alphas]) => (
                                  <div
                                    key={shade}
                                    className="flex items-center gap-2"
                                  >
                                    <span
                                      className="text-xs w-14 font-mono"
                                      style={{ color: textMuted }}
                                    >
                                      {shade}
                                    </span>
                                    <input
                                      type="text"
                                      value={alphas}
                                      onChange={(e) =>
                                        setAlphaConfig((prev) => ({
                                          ...prev,
                                          primitiveShades: {
                                            ...prev.primitiveShades,
                                            [shade]: e.target.value,
                                          },
                                        }))
                                      }
                                      className="flex-1 px-2 py-0.5 rounded border text-xs font-mono"
                                      style={inputStyle}
                                      placeholder="e.g. 10,50,80"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Per-on-shade alphas */}
                            <div
                              className="mt-3 pt-3"
                              style={{ borderTop: `1px solid ${borderColor}` }}
                            >
                              <span className="text-xs font-medium">
                                On-Shades
                              </span>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                                {Object.entries(
                                  alphaConfig.onPrimitiveShades || {}
                                ).map(([shade, alphas]) => (
                                  <div
                                    key={shade}
                                    className="flex items-center gap-2"
                                  >
                                    <span
                                      className="text-xs w-14 font-mono"
                                      style={{ color: textMuted }}
                                    >
                                      on-{shade}
                                    </span>
                                    <input
                                      type="text"
                                      value={alphas}
                                      onChange={(e) =>
                                        setAlphaConfig((prev) => ({
                                          ...prev,
                                          onPrimitiveShades: {
                                            ...prev.onPrimitiveShades,
                                            [shade]: e.target.value,
                                          },
                                        }))
                                      }
                                      className="flex-1 px-2 py-0.5 rounded border text-xs font-mono"
                                      style={inputStyle}
                                      placeholder="e.g. 10,50,80"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ConfigSection>

                    {/* Exclusions */}
                    <ConfigSection
                      title="Exclusions"
                      description={EXPORT_INFO.exclusions}
                      isOpen={exportSections.exclusions}
                      onToggle={() => toggleSection("exclusions")}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs">
                          Exclude groups starting with:
                        </span>
                        <input
                          type="text"
                          value={exclusionPattern}
                          onChange={(e) => setExclusionPattern(e.target.value)}
                          className="w-20 px-3 py-1.5 rounded border text-xs text-center font-mono"
                          style={inputStyle}
                        />
                      </div>
                      {parsedLightFile?.excluded?.length > 0 && (
                        <p
                          className="text-xs mt-3"
                          style={{ color: textMuted }}
                        >
                          Found excluded: {parsedLightFile.excluded.join(", ")}
                        </p>
                      )}
                    </ConfigSection>
                  </>
                )}

                {/* Export Actions & Preview */}
                <ConfigSection
                  title="Preview & Export"
                  isOpen={exportSections.preview}
                  onToggle={() => toggleSection("preview")}
                  badge={figmaExportType === "palette" ? "palette" : "semantic"}
                >
                  <div className="space-y-4">
                    {figmaExportType === "palette" ? (
                      <>
                        {/* Token Count */}
                        <div
                          className="p-3 rounded-lg text-xs"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          <span style={{ color: textMuted }}>
                            Token count:{" "}
                          </span>
                          <span className="font-medium">
                            {countTokens(
                              generateFigmaPalette(figmaPaletteFile)
                            )}{" "}
                            variables
                          </span>
                          <span style={{ color: textMuted }}>
                            {" "}
                            ({hues.length} hues × {stops.length} shades)
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              copyToClipboard(
                                generateFigmaPalette(figmaPaletteFile),
                                "figma-palette"
                              );
                            }}
                            className="px-4 py-2 rounded text-sm flex items-center gap-2"
                            style={{
                              backgroundColor: isDark ? "#333" : "#e5e5e5",
                              color: textColor,
                            }}
                          >
                            {copiedIndex === "figma-palette" ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}{" "}
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              downloadFigmaFile(
                                generateFigmaPalette(figmaPaletteFile),
                                "palette.tokens.json"
                              );
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Download palette.tokens.json
                          </button>
                        </div>
                        <pre
                          className="p-4 rounded text-xs font-mono overflow-auto max-h-80"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                            color: textColor,
                          }}
                        >
                          {generateFigmaPalette(figmaPaletteFile).slice(
                            0,
                            4000
                          )}
                          {generateFigmaPalette(figmaPaletteFile).length >
                            4000 && "\n..."}
                        </pre>
                      </>
                    ) : (
                      <>
                        {/* Token Count */}
                        <div
                          className="p-3 rounded-lg text-xs"
                          style={{
                            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                          }}
                        >
                          <span style={{ color: textMuted }}>
                            Token count per file:{" "}
                          </span>
                          <span className="font-medium">
                            {countTokens(
                              generateFigmaSemanticTokens(
                                "light",
                                figmaLightFile
                              )
                            )}{" "}
                            variables
                          </span>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => {
                              copyToClipboard(
                                generateFigmaSemanticTokens(
                                  "light",
                                  figmaLightFile
                                ),
                                "figma-light"
                              );
                            }}
                            className="px-4 py-2 rounded text-sm flex items-center gap-2"
                            style={{
                              backgroundColor: isDark ? "#333" : "#e5e5e5",
                              color: textColor,
                            }}
                          >
                            {copiedIndex === "figma-light" ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}{" "}
                            Copy Light
                          </button>
                          <button
                            onClick={() => {
                              copyToClipboard(
                                generateFigmaSemanticTokens(
                                  "dark",
                                  figmaDarkFile
                                ),
                                "figma-dark"
                              );
                            }}
                            className="px-4 py-2 rounded text-sm flex items-center gap-2"
                            style={{
                              backgroundColor: isDark ? "#333" : "#e5e5e5",
                              color: textColor,
                            }}
                          >
                            {copiedIndex === "figma-dark" ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}{" "}
                            Copy Dark
                          </button>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => {
                              downloadFigmaFile(
                                generateFigmaSemanticTokens(
                                  "light",
                                  figmaLightFile
                                ),
                                "light.tokens.json"
                              );
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Download light.tokens.json
                          </button>
                          <button
                            onClick={() => {
                              downloadFigmaFile(
                                generateFigmaSemanticTokens(
                                  "dark",
                                  figmaDarkFile
                                ),
                                "dark.tokens.json"
                              );
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Download dark.tokens.json
                          </button>
                          <button
                            onClick={() => {
                              downloadFigmaFile(
                                generateFigmaSemanticTokens(
                                  "light",
                                  figmaLightFile
                                ),
                                "light.tokens.json"
                              );
                              setTimeout(() => {
                                downloadFigmaFile(
                                  generateFigmaSemanticTokens(
                                    "dark",
                                    figmaDarkFile
                                  ),
                                  "dark.tokens.json"
                                );
                              }, 100);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download Both
                          </button>
                        </div>

                        {/* Preview tabs for light/dark */}
                        <div>
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => setSemanticPreviewMode("light")}
                              className={`px-3 py-1 rounded text-xs ${
                                semanticPreviewMode === "light"
                                  ? "bg-blue-600 text-white"
                                  : ""
                              }`}
                              style={
                                semanticPreviewMode !== "light"
                                  ? {
                                      backgroundColor: isDark
                                        ? "#333"
                                        : "#e5e5e5",
                                      color: textColor,
                                    }
                                  : {}
                              }
                            >
                              light.tokens.json
                            </button>
                            <button
                              onClick={() => setSemanticPreviewMode("dark")}
                              className={`px-3 py-1 rounded text-xs ${
                                semanticPreviewMode === "dark"
                                  ? "bg-blue-600 text-white"
                                  : ""
                              }`}
                              style={
                                semanticPreviewMode !== "dark"
                                  ? {
                                      backgroundColor: isDark
                                        ? "#333"
                                        : "#e5e5e5",
                                      color: textColor,
                                    }
                                  : {}
                              }
                            >
                              dark.tokens.json
                            </button>
                          </div>
                          <pre
                            className="p-4 rounded text-xs font-mono overflow-auto max-h-80"
                            style={{
                              backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
                              color: textColor,
                            }}
                          >
                            {generateFigmaSemanticTokens(
                              semanticPreviewMode,
                              semanticPreviewMode === "light"
                                ? figmaLightFile
                                : figmaDarkFile
                            ).slice(0, 4000)}
                            {generateFigmaSemanticTokens(
                              semanticPreviewMode,
                              semanticPreviewMode === "light"
                                ? figmaLightFile
                                : figmaDarkFile
                            ).length > 4000 && "\n..."}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                </ConfigSection>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OKLCHPalette;
