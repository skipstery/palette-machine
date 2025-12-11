import React, { useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { usePalette } from '../../context/PaletteContext';
import { generateExport } from '../../lib/exportGenerators';

export function JsonTab() {
  const ctx = usePalette();
  const {
    theme,
    paletteData,
    display,
    inputStyle,
    labelStyle,
    copiedIndex,
    copyToClipboard,
    jsonEditValue,
    setJsonEditValue,
    jsonError,
    setJsonError,
    exportFormat,
    setExportFormat,
  } = ctx;

  const { isDark, cardBg, borderColor, textColor } = theme;
  const { stops, hues, setStops, setHues, setTokens, palette, tokens } = paletteData;
  const { swatchSize } = display;

  // Sync JSON editor when switching to JSON tab or when data changes
  useEffect(() => {
    setJsonEditValue(
      JSON.stringify(
        {
          stops,
          hues,
          settings: {
            bgColorLight: theme.bgColorLight,
            bgColorDark: theme.bgColorDark,
            swatchSize,
          },
        },
        null,
        2
      )
    );
    setJsonError(null);
  }, [stops, hues, theme.bgColorLight, theme.bgColorDark, swatchSize, setJsonEditValue, setJsonError]);

  const handleApplyJson = () => {
    try {
      const config = JSON.parse(jsonEditValue);
      if (config.stops) setStops(config.stops);
      if (config.hues) setHues(config.hues);
      if (config.tokens) setTokens(config.tokens);
      if (config.settings) {
        if (config.settings.bgColorLight)
          theme.setBgColorLight(config.settings.bgColorLight);
        if (config.settings.bgColorDark)
          theme.setBgColorDark(config.settings.bgColorDark);
        if (config.settings.swatchSize)
          display.setSwatchSize(config.settings.swatchSize);
      }
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleGenerateExport = () => {
    return generateExport(palette, stops, tokens, exportFormat);
  };

  return (
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
                <h2 className="text-base font-semibold">Import Configuration</h2>
                <p className="text-xs mt-1" style={labelStyle}>
                  Paste or edit JSON configuration, then click "Apply" to load.
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
                            bgColorLight: theme.bgColorLight,
                            bgColorDark: theme.bgColorDark,
                            swatchSize,
                          },
                        },
                        null,
                        2
                      ),
                      'json-copy'
                    )
                  }
                  className="px-3 py-1 rounded text-sm flex items-center gap-1"
                  style={{
                    backgroundColor: isDark ? '#333' : '#e5e5e5',
                    color: textColor,
                  }}
                >
                  {copiedIndex === 'json-copy' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}{' '}
                  Copy Current
                </button>
                <button
                  onClick={handleApplyJson}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
            {jsonError && (
              <div className="mb-2 p-2 rounded text-sm bg-red-500/20 text-red-400">
                {jsonError}
              </div>
            )}
            <textarea
              value={jsonEditValue}
              onChange={(e) => setJsonEditValue(e.target.value)}
              className="w-full p-4 rounded-lg text-xs font-mono resize-none"
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
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
                  onClick={() => copyToClipboard(handleGenerateExport(), 'export')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  {copiedIndex === 'export' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}{' '}
                  Copy
                </button>
              </div>
            </div>
            <pre
              className="p-4 rounded-lg overflow-auto text-xs font-mono max-h-80"
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                color: textColor,
              }}
            >
              {handleGenerateExport()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JsonTab;
