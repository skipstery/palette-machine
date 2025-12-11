/**
 * REFACTORED APP.JSX EXAMPLE
 *
 * This file demonstrates how to use the extracted modules in your App.jsx.
 * You can gradually replace sections of your original App.jsx with these imports.
 *
 * To use this:
 * 1. Copy the import statements below
 * 2. Replace the corresponding code in your App.jsx
 * 3. Delete the old inline versions
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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

// ✅ STEP 1: Import constants instead of defining them inline
import {
  DEFAULT_STOPS,
  DEFAULT_HUES,
  DEFAULT_TOKENS,
  STORAGE_KEY,
  MAX_HISTORY,
  EXPORT_INFO,
  DEFAULT_ALPHA_CONFIG,
} from "./config/constants";

// ✅ STEP 2: Import color conversion utilities
import {
  oklchToLinearRgb,
  linearToGamma,
  oklchToP3,
  isInGamut,
  clamp,
  rgbToHex,
  hexToRgb,
  cssColorToHex,
  hexToGrayscale,
} from "./utils/colorConversions";

// ✅ STEP 3: Import contrast calculation utilities
import {
  calculateAPCA,
  calculateWCAG,
  getContrast,
  formatContrast,
} from "./utils/contrast";

// ✅ STEP 4: Import UI components
import {
  InfoBlock,
  ConfigSection,
  FormattedDescription,
} from "./components/UI";

// ✅ STEP 5: Import helper utilities
import {
  parseAlphaString,
  alphasToString,
  copyToClipboard,
  downloadFile,
  countTokens,
} from "./utils/helpers";

const OKLCHPalette = () => {
  // ============================================================================
  // STATE - Keep all your existing state here
  // ============================================================================
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [exportFormat, setExportFormat] = useState("json-srgb");
  const [activeTab, setActiveTab] = useState("palette");
  const [mode, setMode] = useState("light");
  const [bgColorLight, setBgColorLight] = useState("oklch(100% 0 0)");
  const [bgColorDark, setBgColorDark] = useState("oklch(25% 0 0)");

  // Use DEFAULT_STOPS, DEFAULT_HUES, DEFAULT_TOKENS from imports
  const [stops, setStops] = useState(() => JSON.parse(JSON.stringify(DEFAULT_STOPS)));
  const [hues, setHues] = useState(() => JSON.parse(JSON.stringify(DEFAULT_HUES)));
  const [tokens, setTokens] = useState(() => JSON.parse(JSON.stringify(DEFAULT_TOKENS)));

  // ============================================================================
  // EXAMPLE: Using extracted color conversion utilities
  // ============================================================================
  const palette = useMemo(() => {
    return hues.map((hue) => ({
      name: hue.name,
      H: hue.H,
      colors: stops.map((stop) => {
        const effectiveC = hue.fullGray ? 0 : stop.C;

        // ✅ Use imported functions instead of inline definitions
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
          name: stop.name,
          L: stop.L,
          C: effectiveC,
          oklch: `oklch(${stop.L}% ${effectiveC} ${hue.H})`,
          hex,
          hexP3,
          inSrgbGamut,
          inP3Gamut,
        };
      }),
    }));
  }, [hues, stops]);

  // ============================================================================
  // EXAMPLE: Using extracted contrast utilities
  // ============================================================================
  const calculateColorContrast = useCallback((colorHex, bgHex, algo, direction) => {
    // ✅ Use imported getContrast function
    return getContrast(colorHex, bgHex, algo, direction);
  }, []);

  // ============================================================================
  // EXAMPLE: Using helper utilities
  // ============================================================================
  const handleCopyColor = (text, index) => {
    // ✅ Use imported copyToClipboard helper
    copyToClipboard(text, setCopiedIndex, index);
  };

  const handleDownloadJSON = () => {
    const data = { stops, hues, tokens };
    // ✅ Use imported downloadFile helper
    downloadFile(JSON.stringify(data, null, 2), "palette-config.json");
  };

  const handleAlphaInputChange = (value) => {
    // ✅ Use imported parseAlphaString and alphasToString
    const parsed = parseAlphaString(value);
    console.log("Parsed alphas:", parsed);
    console.log("Back to string:", alphasToString(parsed));
  };

  // ============================================================================
  // EXAMPLE: Using UI components
  // ============================================================================
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">OKLCH Palette Generator</h1>

      {/* ✅ Use imported InfoBlock component */}
      <InfoBlock
        title="About Intent Colors"
        isOpen={infoOpen}
        onToggle={() => setInfoOpen(!infoOpen)}
        variant="info"
      >
        {/* ✅ Use imported EXPORT_INFO constant */}
        <FormattedDescription text={EXPORT_INFO.intents} />
      </InfoBlock>

      {/* ✅ Use imported ConfigSection component */}
      <div className="mt-4">
        <ConfigSection
          title="Color Settings"
          description={EXPORT_INFO.ground}
          isOpen={true}
          onToggle={() => {}}
          badge={`${palette.length} hues`}
        >
          <p>Your color configuration goes here...</p>
        </ConfigSection>
      </div>

      {/* Example: Display palette */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Generated Palette</h2>
        <div className="grid gap-4">
          {palette.map((hue, hueIdx) => (
            <div key={hueIdx}>
              <h3 className="font-medium mb-2 capitalize">{hue.name}</h3>
              <div className="flex gap-2">
                {hue.colors.map((color, colorIdx) => (
                  <div
                    key={colorIdx}
                    className="w-16 h-16 rounded cursor-pointer relative group"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => handleCopyColor(color.hex, `${hueIdx}-${colorIdx}`)}
                    title={color.hex}
                  >
                    {!color.inSrgbGamut && (
                      <div className="absolute top-1 right-1 text-yellow-400">
                        <AlertTriangle size={12} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 rounded text-white text-xs">
                      {color.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example: Actions */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleDownloadJSON}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Download size={16} className="inline mr-2" />
          Download Config
        </button>
      </div>

      {/*
        ============================================================================
        NEXT STEPS FOR FULL REFACTORING:
        ============================================================================

        1. Extract remaining large functions (Figma export, file analysis)
        2. Create custom hooks:
           - useHistory(state) for undo/redo
           - usePaletteState() for centralized state
           - useLocalStorage(key, defaultValue)

        3. Break down into tab components:
           <PaletteTab palette={palette} onCopy={handleCopy} />
           <ShadesTab stops={stops} onChange={setStops} />
           <HuesTab hues={hues} onChange={setHues} />
           <JsonTab config={{stops, hues, tokens}} onChange={loadConfig} />
           <FigmaTab palette={palette} config={figmaConfig} />

        4. Add TypeScript types for better DX (optional but recommended)

        See REFACTORING_GUIDE.md for the complete migration strategy!
      */}
    </div>
  );
};

export default OKLCHPalette;
