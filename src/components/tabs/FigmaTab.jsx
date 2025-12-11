import React from 'react';
import { Copy, Check, Download, RefreshCw } from 'lucide-react';
import { usePalette } from '../../context/PaletteContext';
import { InfoBlock, ConfigSection } from '../UI';

export function FigmaTab() {
  const ctx = usePalette();
  const { theme, paletteData, figma, copiedIndex, copyToClipboard, labelStyle } = ctx;

  const { isDark, cardBg, borderColor, textColor, textMuted } = theme;
  const { stops } = paletteData;
  const {
    figmaExportType,
    setFigmaExportType,
    figmaPaletteFile,
    figmaLightFile,
    figmaDarkFile,
    semanticPreviewMode,
    setSemanticPreviewMode,
    exportSections,
    toggleSection,
    generateFigmaPalette,
    generateFigmaSemanticTokens,
    countTokens,
    downloadFigmaFile,
  } = figma;

  const paletteOutput = generateFigmaPalette(figmaPaletteFile);
  const lightOutput = generateFigmaSemanticTokens('light', figmaLightFile);
  const darkOutput = generateFigmaSemanticTokens('dark', figmaDarkFile);

  return (
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
            <h2 className="text-lg font-semibold mb-1">Figma Variables Export</h2>
            <p className="text-sm" style={{ color: textMuted }}>
              Generate Figma-compatible variable files for your design system.
            </p>
          </div>

          {/* Token Taxonomy Reference */}
          <InfoBlock
            title="📚 Token Taxonomy & Structure"
            isOpen={exportSections.concepts}
            onToggle={() => toggleSection('concepts')}
          >
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Collections</h4>
                <div className="space-y-3">
                  <div
                    className="p-3 rounded"
                    style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <code
                        className="px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: isDark ? '#333' : '#ddd' }}
                      >
                        palette
                      </code>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: isDark ? '#4a2a2a' : '#fef2f2',
                          color: isDark ? '#f87171' : '#dc2626',
                        }}
                      >
                        internal only
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: textMuted }}>
                      Primitive colors with shades 0-1000. Hidden from designers via scopes.
                    </p>
                  </div>
                  <div
                    className="p-3 rounded"
                    style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <code
                        className="px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: isDark ? '#333' : '#ddd' }}
                      >
                        theme
                      </code>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: isDark ? '#2a4a2a' : '#f0fdf4',
                          color: isDark ? '#4ade80' : '#16a34a',
                        }}
                      >
                        for usage
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: textMuted }}>
                      Semantic tokens with light/dark modes. This is what designers use.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </InfoBlock>

          {/* Export Type Selection */}
          <div
            className="rounded-lg p-5"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <label className="text-xs block mb-2" style={labelStyle}>
              Export Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFigmaExportType('palette')}
                className={`px-4 py-2 rounded text-sm ${
                  figmaExportType === 'palette' ? 'bg-blue-600 text-white' : ''
                }`}
                style={
                  figmaExportType !== 'palette'
                    ? { backgroundColor: isDark ? '#333' : '#e5e5e5', color: textColor }
                    : {}
                }
              >
                Palette (Primitives)
              </button>
              <button
                onClick={() => setFigmaExportType('semantic')}
                className={`px-4 py-2 rounded text-sm ${
                  figmaExportType === 'semantic' ? 'bg-blue-600 text-white' : ''
                }`}
                style={
                  figmaExportType !== 'semantic'
                    ? { backgroundColor: isDark ? '#333' : '#e5e5e5', color: textColor }
                    : {}
                }
              >
                Theme (Semantic)
              </button>
            </div>
          </div>

          {/* Preview & Export Section */}
          <ConfigSection
            title="Preview & Export"
            isOpen={exportSections.preview}
            onToggle={() => toggleSection('preview')}
          >
            {figmaExportType === 'palette' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    <strong>{countTokens(paletteOutput)}</strong> variables
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(paletteOutput, 'palette-copy')}
                      className="px-3 py-1 rounded text-sm flex items-center gap-1"
                      style={{
                        backgroundColor: isDark ? '#333' : '#e5e5e5',
                        color: textColor,
                      }}
                    >
                      {copiedIndex === 'palette-copy' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}{' '}
                      Copy
                    </button>
                    <button
                      onClick={() => downloadFigmaFile(paletteOutput, 'palette.tokens.json')}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
                <pre
                  className="p-4 rounded text-xs font-mono overflow-auto max-h-80"
                  style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                    color: textColor,
                  }}
                >
                  {paletteOutput.slice(0, 4000)}
                  {paletteOutput.length > 4000 && '\n...'}
                </pre>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Light theme */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">light.tokens.json</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(lightOutput, 'light-copy')}
                        className="px-3 py-1 rounded text-sm flex items-center gap-1"
                        style={{
                          backgroundColor: isDark ? '#333' : '#e5e5e5',
                          color: textColor,
                        }}
                      >
                        {copiedIndex === 'light-copy' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}{' '}
                        Copy
                      </button>
                      <button
                        onClick={() => downloadFigmaFile(lightOutput, 'light.tokens.json')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                  </div>
                  <span className="text-xs" style={labelStyle}>
                    <strong>{countTokens(lightOutput)}</strong> variables
                  </span>
                </div>

                {/* Dark theme */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">dark.tokens.json</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(darkOutput, 'dark-copy')}
                        className="px-3 py-1 rounded text-sm flex items-center gap-1"
                        style={{
                          backgroundColor: isDark ? '#333' : '#e5e5e5',
                          color: textColor,
                        }}
                      >
                        {copiedIndex === 'dark-copy' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}{' '}
                        Copy
                      </button>
                      <button
                        onClick={() => downloadFigmaFile(darkOutput, 'dark.tokens.json')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                  </div>
                  <span className="text-xs" style={labelStyle}>
                    <strong>{countTokens(darkOutput)}</strong> variables
                  </span>
                </div>

                {/* Preview toggle */}
                <div className="pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setSemanticPreviewMode('light')}
                      className={`px-3 py-1 rounded text-xs ${
                        semanticPreviewMode === 'light' ? 'bg-blue-600 text-white' : ''
                      }`}
                      style={
                        semanticPreviewMode !== 'light'
                          ? { backgroundColor: isDark ? '#333' : '#e5e5e5', color: textColor }
                          : {}
                      }
                    >
                      light.tokens.json
                    </button>
                    <button
                      onClick={() => setSemanticPreviewMode('dark')}
                      className={`px-3 py-1 rounded text-xs ${
                        semanticPreviewMode === 'dark' ? 'bg-blue-600 text-white' : ''
                      }`}
                      style={
                        semanticPreviewMode !== 'dark'
                          ? { backgroundColor: isDark ? '#333' : '#e5e5e5', color: textColor }
                          : {}
                      }
                    >
                      dark.tokens.json
                    </button>
                  </div>
                  <pre
                    className="p-4 rounded text-xs font-mono overflow-auto max-h-80"
                    style={{
                      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                      color: textColor,
                    }}
                  >
                    {(semanticPreviewMode === 'light' ? lightOutput : darkOutput).slice(0, 4000)}
                    {(semanticPreviewMode === 'light' ? lightOutput : darkOutput).length > 4000 &&
                      '\n...'}
                  </pre>
                </div>
              </div>
            )}
          </ConfigSection>
        </div>
      </div>
    </div>
  );
}

export default FigmaTab;
