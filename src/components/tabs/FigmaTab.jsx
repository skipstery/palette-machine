import React from 'react';
import { Copy, Check, Download, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import { usePalette } from '../../context/PaletteContext';
import { InfoBlock, ConfigSection } from '../UI';
import { EXPORT_INFO } from '../../config/constants';

export function FigmaTab() {
  const ctx = usePalette();
  const { theme, paletteData, figma, copiedIndex, copyToClipboard, inputStyle, labelStyle } = ctx;

  const { isDark, cardBg, borderColor, textColor, textMuted } = theme;
  const { palette, stops, hues } = paletteData;
  const {
    figmaExportType,
    setFigmaExportType,
    figmaColorProfile,
    setFigmaColorProfile,
    figmaPaletteFile,
    figmaLightFile,
    figmaDarkFile,
    parsedPaletteFile,
    parsedLightFile,
    parsedDarkFile,
    paletteScopes,
    setPaletteScopes,
    alphaConfig,
    setAlphaConfig,
    shadeSourceMap,
    setShadeSourceMap,
    themeShadeSourceMap,
    setThemeShadeSourceMap,
    hueMapping,
    setHueMapping,
    exclusionPattern,
    setExclusionPattern,
    namingConfig,
    setNamingConfig,
    onColorThreshold,
    setOnColorThreshold,
    figmaGroundLight,
    setFigmaGroundLight,
    figmaGroundDark,
    setFigmaGroundDark,
    groundCustomColors,
    setGroundCustomColors,
    groundRefType,
    setGroundRefType,
    onGroundColor,
    setOnGroundColor,
    starkShades,
    setStarkShades,
    starkDefaultShade,
    setStarkDefaultShade,
    figmaIntentMap,
    setFigmaIntentMap,
    figmaDefaultShade,
    setFigmaDefaultShade,
    semanticPreviewMode,
    setSemanticPreviewMode,
    exportSections,
    toggleSection,
    handlePaletteFileUpload,
    handleLightFileUpload,
    handleDarkFileUpload,
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
            <div className="space-y-6 text-sm">
              {/* Collections Overview */}
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
                      Primitive colors (gray, blue, red...) with shades 0-1000. Hidden from designers via scopes. Code syntax = raw CSS variable:{' '}
                      <code className="px-1 rounded" style={{ backgroundColor: isDark ? '#333' : '#ddd' }}>
                        --blue-500
                      </code>
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
                      Semantic tokens with light/dark modes. This is what designers use. Code syntax = Tailwind class:{' '}
                      <code className="px-1 rounded" style={{ backgroundColor: isDark ? '#333' : '#ddd' }}>
                        bg-primary-500
                      </code>
                      ,{' '}
                      <code className="px-1 rounded" style={{ backgroundColor: isDark ? '#333' : '#ddd' }}>
                        text-on-primary/15
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Token Structure Table */}
              <div>
                <h4 className="font-semibold mb-3">Token Path Structure</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
                        <th className="text-left p-2 border" style={{ borderColor }}>Figma Path</th>
                        <th className="text-left p-2 border" style={{ borderColor }}>Code Syntax</th>
                        <th className="text-left p-2 border" style={{ borderColor }}>Tailwind Usage</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      <tr>
                        <td colSpan="3" className="p-2 font-sans font-semibold" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }}>
                          Theme: Intents & Hues (primary, danger, blue, etc.)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/<span style={{ color: '#6b9' }}>primary</span></td>
                        <td className="p-2 border" style={{ borderColor }}>primary</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>bg-primary</td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/primary/<span style={{ color: '#6b9' }}>shade</span>/100</td>
                        <td className="p-2 border" style={{ borderColor }}>primary-100</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>bg-primary-100</td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/primary/shade/100/<span style={{ color: '#f90' }}>15</span></td>
                        <td className="p-2 border" style={{ borderColor }}>primary-100/15</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>bg-primary-100/15</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="p-2 font-sans font-semibold" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }}>
                          Theme: Foreground (on-) Colors
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/<span style={{ color: '#6b9' }}>on</span>/primary/<span style={{ color: '#f90' }}>15</span></td>
                        <td className="p-2 border" style={{ borderColor }}>on-primary/15</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>text-on-primary/15</td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/on/primary/<span style={{ color: '#6b9' }}>shade</span>/100</td>
                        <td className="p-2 border" style={{ borderColor }}>on-primary-100</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>text-on-primary-100</td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/on/primary/shade/100/<span style={{ color: '#f90' }}>15</span></td>
                        <td className="p-2 border" style={{ borderColor }}>on-primary-100/15</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>text-on-primary-100/15</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="p-2 font-sans font-semibold" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }}>
                          Theme: Ground, Black, White (no shades)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/<span style={{ color: '#6b9' }}>ground</span></td>
                        <td className="p-2 border" style={{ borderColor }}>ground</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>bg-ground</td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/ground/<span style={{ color: '#f90' }}>15</span></td>
                        <td className="p-2 border" style={{ borderColor }}>ground/15</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>bg-ground/15</td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>theme/on/ground/<span style={{ color: '#f90' }}>15</span></td>
                        <td className="p-2 border" style={{ borderColor }}>on-ground/15</td>
                        <td className="p-2 border" style={{ borderColor, color: textMuted }}>text-on-ground/15</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="p-2 font-sans font-semibold" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }}>
                          Palette: Primitives (flat structure, internal use)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>palette/<span style={{ color: '#6b9' }}>--gray</span></td>
                        <td className="p-2 border" style={{ borderColor }}>--gray</td>
                        <td className="p-2 border font-sans" style={{ borderColor, color: textMuted }}>n/a (internal)</td>
                      </tr>
                      <tr>
                        <td className="p-2 border" style={{ borderColor }}>palette/<span style={{ color: '#6b9' }}>--gray-500</span></td>
                        <td className="p-2 border" style={{ borderColor }}>--gray-500</td>
                        <td className="p-2 border font-sans" style={{ borderColor, color: textMuted }}>n/a (internal)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Concepts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
                  <h5 className="font-semibold text-xs mb-2">Shades vs Alphas</h5>
                  <ul className="text-xs space-y-1" style={{ color: textMuted }}>
                    <li><code>primary/shade/500</code> → shade (lightness)</li>
                    <li><code>primary/15</code> → alpha (opacity 15%)</li>
                    <li>Shades: 0, 50, 100...900, 950, 1000</li>
                    <li>Alphas: 3, 5, 10, 15, 20, 25...100</li>
                  </ul>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
                  <h5 className="font-semibold text-xs mb-2">Naming Convention</h5>
                  <ul className="text-xs space-y-1" style={{ color: textMuted }}>
                    <li>Figma paths use <code>/</code> for hierarchy</li>
                    <li>Code syntax: <code>-</code> for shades, <code>/</code> for alpha</li>
                    <li><code>primary-500</code> = shade 500</li>
                    <li><code>primary/15</code> = 15% opacity</li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
                  <h5 className="font-semibold text-xs mb-2">Dark Mode</h5>
                  <ul className="text-xs space-y-1" style={{ color: textMuted }}>
                    <li>Theme shades reverse around 500 pivot</li>
                    <li>100→900, 400→600, 500→500</li>
                    <li>Exceptions: black, white, ground</li>
                  </ul>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
                  <h5 className="font-semibold text-xs mb-2">File Detection</h5>
                  <ul className="text-xs space-y-1" style={{ color: textMuted }}>
                    <li>Numbers in <code>/shade/</code> group → shades</li>
                    <li>Numbers directly on intent → alphas</li>
                    <li>Theme Mapping uses only shades</li>
                  </ul>
                </div>
              </div>

              {/* Why this structure */}
              <div
                className="p-3 rounded text-xs"
                style={{
                  backgroundColor: isDark ? '#1a2a1a' : '#f0fff0',
                  border: `1px solid ${isDark ? '#2a4a2a' : '#c0e0c0'}`,
                }}
              >
                <h5 className="font-semibold mb-1">💡 Why this structure?</h5>
                <p style={{ color: textMuted }}>
                  The <code>/shade/</code> subgroup in Figma enables smart autocomplete: typing "pri 50" suggests alpha variants first (common case), while "pri sha 500" explicitly targets shades. The <code>/on/</code> prefix groups all foreground colors together for easy discovery. Palette primitives use <code>--</code> prefix to indicate they're raw CSS variables, not meant for direct Tailwind usage.
                </p>
              </div>
            </div>
          </InfoBlock>

          {/* File Upload Section */}
          <ConfigSection
            title="📁 Upload Existing Files"
            description="Upload your current Figma variable files to preserve variableIds and analyze existing structure."
            isOpen={exportSections.files}
            onToggle={() => toggleSection('files')}
          >
            <div className="space-y-4">
              {/* palette.tokens.json */}
              <div
                className="p-4 rounded"
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  border: figmaPaletteFile ? '1px solid #22c55e' : '1px solid #f59e0b',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">palette.tokens.json</h4>
                  {parsedPaletteFile && !parsedPaletteFile.error && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      {parsedPaletteFile.hues.length} hues × {parsedPaletteFile.shades.length} shades
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
                      reader.onload = (ev) => handlePaletteFileUpload(ev.target.result);
                      reader.readAsText(file);
                    }
                  }}
                  className="text-xs mb-2"
                />
                {figmaPaletteFile ? (
                  <div className="space-y-1">
                    <p className="text-xs text-green-500">✓ File loaded - variableIds will be preserved</p>
                    {parsedPaletteFile && !parsedPaletteFile.error && (
                      <div className="text-xs" style={{ color: textMuted }}>
                        <p>Hues: {parsedPaletteFile.hues.join(', ')}</p>
                        <p>Shades: {parsedPaletteFile.shades.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-500">⚠️ No file - will generate NEW variableIds</p>
                )}
              </div>

              {/* light.tokens.json */}
              <div
                className="p-4 rounded"
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  border: figmaLightFile ? '1px solid #22c55e' : '1px solid #f59e0b',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">light.tokens.json</h4>
                  {parsedLightFile && !parsedLightFile.error && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      {parsedLightFile.intents.length} intents, {parsedLightFile.hues.length} hues
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
                      reader.onload = (ev) => handleLightFileUpload(ev.target.result);
                      reader.readAsText(file);
                    }
                  }}
                  className="text-xs mb-2"
                />
                {figmaLightFile ? (
                  <div className="space-y-1">
                    <p className="text-xs text-green-500">✓ File loaded - variableIds will be preserved</p>
                    {parsedLightFile && !parsedLightFile.error && (
                      <div className="text-xs" style={{ color: textMuted }}>
                        {parsedLightFile.intents.length > 0 && (
                          <p>Intents: {parsedLightFile.intents.map((i) => i.name).join(', ')}</p>
                        )}
                        {parsedLightFile.excluded.length > 0 && (
                          <p>Excluded: {parsedLightFile.excluded.join(', ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-500">⚠️ No file - will generate NEW variableIds</p>
                )}
              </div>

              {/* dark.tokens.json */}
              <div
                className="p-4 rounded"
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  border: figmaDarkFile ? '1px solid #22c55e' : '1px solid #f59e0b',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">dark.tokens.json</h4>
                  {parsedDarkFile && !parsedDarkFile.error && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      {parsedDarkFile.intents.length} intents, {parsedDarkFile.hues.length} hues
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
                      reader.onload = (ev) => handleDarkFileUpload(ev.target.result);
                      reader.readAsText(file);
                    }
                  }}
                  className="text-xs mb-2"
                />
                {figmaDarkFile ? (
                  <p className="text-xs text-green-500">✓ File loaded - variableIds will be preserved</p>
                ) : (
                  <p className="text-xs text-amber-500">⚠️ No file - will generate NEW variableIds</p>
                )}
              </div>
            </div>
          </ConfigSection>

          {/* Figma Document Profile */}
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${figmaColorProfile === 'p3' ? '#22c55e' : borderColor}`,
            }}
          >
            <h3 className="text-sm font-medium mb-2">Figma Document Color Profile</h3>
            <p className="text-xs mb-3" style={{ color: textMuted }}>
              Must match your Figma file's color profile (File → Color Profile).
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFigmaColorProfile('srgb')}
                className={`px-4 py-2 rounded text-sm ${figmaColorProfile === 'srgb' ? 'bg-blue-600 text-white' : ''}`}
                style={figmaColorProfile !== 'srgb' ? { backgroundColor: isDark ? '#333' : '#e5e5e5', color: textColor } : {}}
              >
                sRGB
              </button>
              <button
                onClick={() => setFigmaColorProfile('p3')}
                className={`px-4 py-2 rounded text-sm ${figmaColorProfile === 'p3' ? 'bg-blue-600 text-white' : ''}`}
                style={figmaColorProfile !== 'p3' ? { backgroundColor: isDark ? '#333' : '#e5e5e5', color: textColor } : {}}
              >
                Display P3 ✨
              </button>
            </div>
            {figmaColorProfile === 'p3' && (
              <p className="text-xs mt-2 text-green-500">✓ Wide gamut colors preserved. Ensure Figma doc is set to Display P3.</p>
            )}
          </div>

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
                className={`px-4 py-2 rounded text-sm ${figmaExportType === 'palette' ? 'bg-blue-600 text-white' : ''}`}
                style={figmaExportType !== 'palette' ? { backgroundColor: isDark ? '#333' : '#e5e5e5', color: textColor } : {}}
              >
                Palette (Primitives)
              </button>
              <button
                onClick={() => setFigmaExportType('semantic')}
                className={`px-4 py-2 rounded text-sm ${figmaExportType === 'semantic' ? 'bg-blue-600 text-white' : ''}`}
                style={figmaExportType !== 'semantic' ? { backgroundColor: isDark ? '#333' : '#e5e5e5', color: textColor } : {}}
              >
                Theme (Semantic)
              </button>
            </div>
          </div>

          {/* Palette-specific config */}
          {figmaExportType === 'palette' && (
            <>
              {/* Variable Scopes */}
              <ConfigSection
                title="Variable Scopes"
                description="Restrict where palette primitives can be applied in Figma"
                isOpen={exportSections.paletteScopes || false}
                onToggle={() => toggleSection('paletteScopes')}
              >
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: textMuted }}>
                    Hide primitives from property pickers to enforce semantic token usage.
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: 'ALL_SCOPES', label: 'Show in all properties', desc: 'No restrictions' },
                      { value: 'ALL_FILLS', label: 'All fills only', desc: 'Frame, shape, text' },
                      { value: 'FRAME_FILL', label: 'Frame fill', desc: '' },
                      { value: 'SHAPE_FILL', label: 'Shape fill', desc: '' },
                      { value: 'TEXT_FILL', label: 'Text fill', desc: '' },
                      { value: 'STROKE_COLOR', label: 'Stroke', desc: '' },
                      { value: 'EFFECT_COLOR', label: 'Effects', desc: 'Shadows, etc.' },
                    ].map((scope) => {
                      const isAll = scope.value === 'ALL_SCOPES';
                      const isChecked = isAll ? paletteScopes.includes('ALL_SCOPES') : paletteScopes.includes(scope.value);
                      return (
                        <label key={scope.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (isAll) {
                                setPaletteScopes(e.target.checked ? ['ALL_SCOPES'] : []);
                              } else {
                                setPaletteScopes((prev) => {
                                  const filtered = prev.filter((s) => s !== 'ALL_SCOPES');
                                  if (e.target.checked) {
                                    return [...filtered, scope.value];
                                  } else {
                                    return filtered.filter((s) => s !== scope.value);
                                  }
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-xs">{scope.label}</span>
                          {scope.desc && (
                            <span className="text-xs" style={{ color: textMuted }}>({scope.desc})</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }}>
                    {paletteScopes.length === 0 ? (
                      <span className="text-green-500">✓ Hidden from all — designers must use semantic tokens</span>
                    ) : paletteScopes.includes('ALL_SCOPES') ? (
                      <span className="text-amber-500">⚠ Visible everywhere — consider restricting</span>
                    ) : (
                      <span style={{ color: textMuted }}>Visible in: {paletteScopes.join(', ')}</span>
                    )}
                  </div>
                </div>
              </ConfigSection>

              {/* Palette Mapping */}
              <ConfigSection
                title="Palette Mapping"
                description={`Maps ${hues.length} hues × ${stops.length} shades = ${hues.length * stops.length} color primitives`}
                isOpen={exportSections.paletteMapping}
                onToggle={() => toggleSection('paletteMapping')}
                badge={parsedPaletteFile ? 'File loaded' : null}
              >
                {parsedPaletteFile && !parsedPaletteFile.error ? (
                  <div className="space-y-6">
                    {/* Hue Mapping */}
                    <div>
                      <h4 className="text-xs font-medium mb-3">Hue Mapping</h4>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        {Object.entries(hueMapping).map(([existingHue, machineHue]) => (
                          <div key={existingHue} className="flex items-center gap-4 text-xs">
                            <span className="w-24 truncate font-mono" title={existingHue}>{existingHue}</span>
                            <span style={{ color: textMuted }}>→</span>
                            <select
                              value={machineHue}
                              onChange={(e) => setHueMapping((prev) => ({ ...prev, [existingHue]: e.target.value }))}
                              className="px-2 py-1 rounded border text-xs flex-1"
                              style={inputStyle}
                            >
                              {hues.map((h) => (
                                <option key={h.name} value={h.name}>{h.name}</option>
                              ))}
                              <option value={existingHue}>{existingHue} (keep)</option>
                            </select>
                            <span className="w-8 text-center flex-shrink-0">
                              {existingHue.toLowerCase() === machineHue.toLowerCase() || (existingHue === 'grey' && machineHue === 'gray') ? (
                                <span className="text-green-500">✓</span>
                              ) : (
                                <span className="text-amber-500">⚠</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shade comparison */}
                    <div>
                      <h4 className="text-xs font-medium mb-3">Shade Comparison</h4>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span style={{ color: textMuted }}>File: </span>
                          <span className="font-mono">{parsedPaletteFile.shades.join(', ')}</span>
                        </div>
                        <div>
                          <span style={{ color: textMuted }}>Machine: </span>
                          <span className="font-mono">{stops.map((s) => s.name).join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shade Migration */}
                    <div>
                      <h4 className="text-xs font-medium mb-3">Shade Migration</h4>
                      <p className="text-xs mb-4" style={{ color: textMuted }}>
                        For each machine shade, choose which existing Figma variable to use (preserving its ID) or create new.
                      </p>
                      <div className="rounded-lg overflow-hidden border" style={{ borderColor }}>
                        <div className="grid grid-cols-3 gap-4 p-3 text-xs font-medium" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }}>
                          <span>Machine Shade</span>
                          <span>Source Variable</span>
                          <span>Action</span>
                        </div>
                        <div>
                          {stops.map((stop, idx) => {
                            const source = shadeSourceMap[stop.name] || 'new';
                            const isNew = source === 'new';
                            const isRename = !isNew && source !== stop.name;
                            const isUpdate = !isNew && source === stop.name;
                            return (
                              <div
                                key={stop.name}
                                className="grid grid-cols-3 gap-4 p-3 items-center text-xs"
                                style={{ borderTop: idx > 0 ? `1px solid ${borderColor}` : 'none' }}
                              >
                                <span className="font-mono font-medium">{stop.name}</span>
                                <select
                                  value={source}
                                  onChange={(e) => setShadeSourceMap((prev) => ({ ...prev, [stop.name]: e.target.value }))}
                                  className="px-2 py-1.5 rounded border text-xs"
                                  style={inputStyle}
                                >
                                  <option value="new">— new —</option>
                                  {parsedPaletteFile.shades.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <span className={`flex items-center gap-1.5 ${isNew ? 'text-green-500' : isRename ? 'text-amber-500' : 'text-blue-500'}`}>
                                  {isNew && <><Plus className="w-3.5 h-3.5" /> Create</>}
                                  {isRename && <><RefreshCw className="w-3.5 h-3.5" /> Rename</>}
                                  {isUpdate && <><Check className="w-3.5 h-3.5" /> Update</>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: textMuted }}>
                    Upload palette.tokens.json above to see mapping options.
                  </p>
                )}
              </ConfigSection>
            </>
          )}

          {/* Semantic tokens config */}
          {figmaExportType !== 'palette' && (
            <>
              {/* Intent Colors */}
              <ConfigSection
                title="Intent Colors"
                description={EXPORT_INFO.intents}
                isOpen={exportSections.intents}
                onToggle={() => toggleSection('intents')}
              >
                <div className="space-y-4">
                  {Object.entries(figmaIntentMap).map(([intent, hueName]) => (
                    <div key={intent} className="flex items-center gap-6">
                      <span className="text-xs w-24 font-medium">{intent}</span>
                      <select
                        value={hueName}
                        onChange={(e) => setFigmaIntentMap((prev) => ({ ...prev, [intent]: e.target.value }))}
                        className="px-3 py-1.5 rounded border text-xs flex-1"
                        style={inputStyle}
                      >
                        {hues.map((h) => (
                          <option key={h.name} value={h.name}>{h.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {palette
                          .find((h) => h.name === hueName)
                          ?.colors.filter((c) => ['200', '500', '800'].includes(c.stop))
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
                  ))}
                  <div className="flex items-center gap-6 pt-4 border-t" style={{ borderColor }}>
                    <span className="text-xs w-24">Default shade:</span>
                    <select
                      value={figmaDefaultShade}
                      onChange={(e) => setFigmaDefaultShade(e.target.value)}
                      className="px-3 py-1.5 rounded border text-xs"
                      style={inputStyle}
                    >
                      {stops.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <span className="text-xs" style={{ color: textMuted }}>
                      primary = primary-{figmaDefaultShade}
                    </span>
                  </div>
                </div>
              </ConfigSection>

              {/* Theme Mapping */}
              <ConfigSection
                title="Theme Mapping"
                description="Migrate theme shades while preserving variable IDs"
                isOpen={exportSections.themeMapping}
                onToggle={() => toggleSection('themeMapping')}
                badge={parsedLightFile ? 'File loaded' : null}
              >
                {parsedLightFile && !parsedLightFile.error ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-medium mb-3">Detected Structure</h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span style={{ color: textMuted }}>File shades (from /shade/ group): </span>
                          <span className="font-mono">
                            {[...new Set(parsedLightFile.intents.flatMap((i) => i.shades || []))]
                              .sort((a, b) => Number(a) - Number(b))
                              .join(', ') || 'none'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: textMuted }}>Palette shades (will be generated): </span>
                          <span className="font-mono">{stops.map((s) => s.name).join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium mb-3">Theme Shade Migration</h4>
                      <p className="text-xs mb-4" style={{ color: textMuted }}>
                        For each target shade, choose which existing theme variable to migrate from (preserving its ID) or create new.
                      </p>
                      <div className="rounded-lg overflow-hidden border" style={{ borderColor }}>
                        <div className="grid grid-cols-3 gap-4 p-3 text-xs font-medium" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }}>
                          <span>Target Shade</span>
                          <span>Source Variable</span>
                          <span>Action</span>
                        </div>
                        <div>
                          {stops.map((stop, idx) => {
                            const source = themeShadeSourceMap[stop.name] || 'new';
                            const isNew = source === 'new';
                            const isRename = !isNew && source !== stop.name;
                            const isUpdate = !isNew && source === stop.name;
                            const fileShades = [...new Set(parsedLightFile.intents.flatMap((i) => i.shades || []))].sort((a, b) => Number(a) - Number(b));

                            return (
                              <div
                                key={stop.name}
                                className="grid grid-cols-3 gap-4 p-3 items-center text-xs"
                                style={{ borderTop: idx > 0 ? `1px solid ${borderColor}` : 'none' }}
                              >
                                <span className="font-mono font-medium">{stop.name}</span>
                                <select
                                  value={source}
                                  onChange={(e) => setThemeShadeSourceMap((prev) => ({ ...prev, [stop.name]: e.target.value }))}
                                  className="px-2 py-1.5 rounded border text-xs"
                                  style={inputStyle}
                                >
                                  <option value="new">— new —</option>
                                  {fileShades.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <span className={`flex items-center gap-1.5 ${isNew ? 'text-green-500' : isRename ? 'text-amber-500' : 'text-blue-500'}`}>
                                  {isNew && <><Plus className="w-3.5 h-3.5" /> Create</>}
                                  {isRename && <><RefreshCw className="w-3.5 h-3.5" /> Rename {source}→{stop.name}</>}
                                  {isUpdate && <><Check className="w-3.5 h-3.5" /> Update</>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: textMuted }}>
                    <p>Upload a light.tokens.json file to enable theme shade migration.</p>
                    <p className="mt-2">This allows you to rename shades (e.g., 700→800) while preserving variable IDs.</p>
                  </div>
                )}
              </ConfigSection>

              {/* Token Naming */}
              <ConfigSection
                title="Token Naming"
                description={EXPORT_INFO.naming}
                isOpen={exportSections.naming}
                onToggle={() => toggleSection('naming')}
              >
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-medium mb-4">Elevation Names</h4>
                    <div className="space-y-3">
                      {['elevation0', 'elevation1', 'elevation2'].map((key, i) => (
                        <div key={key} className="flex items-center gap-4">
                          <span className="text-xs w-32" style={{ color: textMuted }}>
                            Elevation {i} ({i === 0 ? 'base' : i === 1 ? 'raised' : 'highest'}):
                          </span>
                          <input
                            type="text"
                            value={namingConfig[key]}
                            onChange={(e) => setNamingConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                            style={inputStyle}
                            placeholder={`ground${i > 0 ? i : ''}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ConfigSection>

              {/* Ground Colors */}
              <ConfigSection
                title="Ground Colors (Elevation)"
                description={EXPORT_INFO.ground}
                isOpen={exportSections.ground}
                onToggle={() => toggleSection('ground')}
              >
                <div className="space-y-6">
                  {['light', 'dark'].map((mode) => (
                    <div key={mode}>
                      <h4 className="text-xs font-medium mb-3 capitalize">{mode} Mode</h4>
                      <div className="space-y-3">
                        {['ground', 'ground1', 'ground2'].map((elevation) => {
                          const groundMap = mode === 'light' ? figmaGroundLight : figmaGroundDark;
                          const setGroundMap = mode === 'light' ? setFigmaGroundLight : setFigmaGroundDark;
                          return (
                            <div key={elevation} className="flex items-center gap-4">
                              <span className="text-xs w-24" style={{ color: textMuted }}>{elevation}:</span>
                              <select
                                value={groundMap[elevation]}
                                onChange={(e) => setGroundMap((prev) => ({ ...prev, [elevation]: e.target.value }))}
                                className="px-3 py-1.5 rounded border text-xs flex-1"
                                style={inputStyle}
                              >
                                {stops.map((s) => (
                                  <option key={s.name} value={s.name}>gray-{s.name}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ConfigSection>

              {/* On-Colors */}
              <ConfigSection
                title="On-Colors (Foreground)"
                description={EXPORT_INFO.onColors}
                isOpen={exportSections.onColors}
                onToggle={() => toggleSection('onColors')}
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <span className="text-xs w-36">Contrast threshold:</span>
                    <input
                      type="number"
                      value={onColorThreshold}
                      onChange={(e) => setOnColorThreshold(Number(e.target.value))}
                      className="w-20 px-3 py-1.5 rounded border text-xs text-center"
                      style={inputStyle}
                      min={0}
                      max={100}
                    />
                    <span className="text-xs" style={{ color: textMuted }}>% luminance threshold</span>
                  </div>

                  {/* APCA Hint */}
                  <div
                    className="p-3 rounded-lg text-xs"
                    style={{ backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }}
                  >
                    <p className="mb-2"><strong>APCA Contrast Guide:</strong></p>
                    <div className="grid grid-cols-2 gap-2" style={{ color: textMuted }}>
                      <div>• Lc 90+ — Body text (16px regular)</div>
                      <div>• Lc 75+ — Large text (24px+, or 18px bold)</div>
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

                  {/* On-Ground Color Selection */}
                  <div>
                    <h4 className="text-xs font-medium mb-3">On-Ground Color</h4>
                    <p className="text-xs mb-4" style={{ color: textMuted }}>
                      Select the foreground color for ground surfaces. Unlike other on-colors (auto black/white), on-ground can be manually configured.
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      {['light', 'dark'].map((mode) => (
                        <div key={mode}>
                          <h5 className="text-xs font-medium mb-3 capitalize">{mode} Mode</h5>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <select
                                value={onGroundColor[mode].refType}
                                onChange={(e) => setOnGroundColor((prev) => ({
                                  ...prev,
                                  [mode]: { ...prev[mode], refType: e.target.value }
                                }))}
                                className="px-3 py-1.5 rounded border text-xs flex-1"
                                style={inputStyle}
                              >
                                <option value="auto">Auto (from ground)</option>
                                <option value="black">Black (#000000)</option>
                                <option value="white">White (#FFFFFF)</option>
                                <option value="custom">Custom OKLCH</option>
                              </select>
                            </div>
                            {onGroundColor[mode].refType === 'custom' && (
                              <input
                                type="text"
                                value={onGroundColor[mode].custom || ''}
                                onChange={(e) => setOnGroundColor((prev) => ({
                                  ...prev,
                                  [mode]: { ...prev[mode], custom: e.target.value }
                                }))}
                                placeholder="oklch(50% 0.1 250)"
                                className="px-3 py-1.5 rounded border text-xs w-full font-mono"
                                style={inputStyle}
                              />
                            )}
                            <div
                              className="h-8 rounded flex items-center justify-center text-xs font-medium"
                              style={{
                                backgroundColor: mode === 'light' ? '#fafafa' : '#1a1a1a',
                                color: onGroundColor[mode].refType === 'black' ? '#000000'
                                  : onGroundColor[mode].refType === 'white' ? '#FFFFFF'
                                  : onGroundColor[mode].refType === 'custom' ? (onGroundColor[mode].custom || '#888')
                                  : (mode === 'light' ? '#000000' : '#FFFFFF'),
                                border: `1px solid ${borderColor}`,
                              }}
                            >
                              on-ground preview
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* On-color preview - full shade set */}
                  <div>
                    <h4 className="text-xs font-medium mb-3">Preview — All Shades</h4>
                    <p className="text-xs mb-4" style={{ color: textMuted }}>
                      Shows which foreground (black/white) will be used for each shade. Background follows the app theme.
                    </p>
                    <div className="space-y-4">
                      {Object.entries(figmaIntentMap).map(([intent, hueName]) => {
                        const hueSet = palette.find((h) => h.name === hueName);
                        if (!hueSet) return null;
                        const fgName = namingConfig.foregroundPosition === 'prefix'
                          ? `${namingConfig.foregroundModifier}${intent}`
                          : `${intent}${namingConfig.foregroundModifier}`;
                        return (
                          <div key={intent} className="flex items-center gap-3">
                            <span className="text-xs w-24 font-medium">{fgName}</span>
                            <div className="flex gap-0.5">
                              {hueSet.colors.map((color) => {
                                const L =
                                  (0.2126 * parseInt(color.hex.slice(1, 3), 16)) / 255 +
                                  (0.7152 * parseInt(color.hex.slice(3, 5), 16)) / 255 +
                                  (0.0722 * parseInt(color.hex.slice(5, 7), 16)) / 255;
                                const useBlack = L > onColorThreshold / 100;
                                return (
                                  <div
                                    key={color.stop}
                                    className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold"
                                    style={{
                                      backgroundColor: color.hex,
                                      color: useBlack ? '#000' : '#fff',
                                    }}
                                    title={`${intent}-${color.stop}: ${useBlack ? 'black' : 'white'}`}
                                  >
                                    {useBlack ? 'B' : 'W'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs" style={{ color: textMuted }}>
                      <span>Shades: {stops.map((s) => s.name).join(', ')}</span>
                    </div>
                  </div>
                </div>
              </ConfigSection>

              {/* Stark Shades */}
              <ConfigSection
                title="Stark Shades"
                description={EXPORT_INFO.stark}
                isOpen={exportSections.stark}
                onToggle={() => toggleSection('stark')}
              >
                <div className="space-y-4">
                  <p className="text-xs" style={{ color: textMuted }}>
                    Stark provides maximum contrast grayscale. Configure default shade for each mode.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {['light', 'dark'].map((mode) => (
                      <div key={mode}>
                        <h4 className="text-xs font-medium mb-3 capitalize">{mode} Mode</h4>
                        <div className="flex items-center gap-4">
                          <span className="text-xs" style={{ color: textMuted }}>Default shade:</span>
                          <select
                            value={starkDefaultShade[mode]}
                            onChange={(e) => setStarkDefaultShade((prev) => ({ ...prev, [mode]: e.target.value }))}
                            className="px-3 py-1.5 rounded border text-xs"
                            style={inputStyle}
                          >
                            {stops.map((s) => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ConfigSection>

              {/* Alpha Variations */}
              <ConfigSection
                title="Alpha Variations"
                description={EXPORT_INFO.alphas}
                isOpen={exportSections.alphas}
                onToggle={() => toggleSection('alphas')}
              >
                <div className="space-y-6">
                  <p className="text-xs" style={{ color: textMuted }}>
                    Configure alpha/opacity variations for different token categories. Format: Use ranges (0-30) or individual values (35, 40, 45).
                  </p>

                  {/* Ground alphas */}
                  <div>
                    <h4 className="text-xs font-medium mb-3">Grounds</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-xs w-32" style={{ color: textMuted }}>ground:</span>
                        <input
                          type="text"
                          value={alphaConfig.ground}
                          onChange={(e) => setAlphaConfig((prev) => ({ ...prev, ground: e.target.value }))}
                          className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                          style={inputStyle}
                          placeholder="0-30,35,40,45,50,55,60,65,70-99"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs w-32" style={{ color: textMuted }}>on-ground:</span>
                        <input
                          type="text"
                          value={alphaConfig.onGround}
                          onChange={(e) => setAlphaConfig((prev) => ({ ...prev, onGround: e.target.value }))}
                          className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                          style={inputStyle}
                          placeholder="5,10,15,20,25,30,40,50,60,70,80,90"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stark alphas */}
                  <div>
                    <h4 className="text-xs font-medium mb-3">Stark</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-xs w-32" style={{ color: textMuted }}>stark:</span>
                        <input
                          type="text"
                          value={alphaConfig.stark}
                          onChange={(e) => setAlphaConfig((prev) => ({ ...prev, stark: e.target.value }))}
                          className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs w-32" style={{ color: textMuted }}>on-stark:</span>
                        <input
                          type="text"
                          value={alphaConfig.onStark}
                          onChange={(e) => setAlphaConfig((prev) => ({ ...prev, onStark: e.target.value }))}
                          className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Black/White */}
                  <div>
                    <h4 className="text-xs font-medium mb-3">Black, White</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-xs w-32" style={{ color: textMuted }}>black/white:</span>
                      <input
                        type="text"
                        value={alphaConfig.blackWhite}
                        onChange={(e) => setAlphaConfig((prev) => ({ ...prev, blackWhite: e.target.value }))}
                        className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Semantic intents */}
                  <div>
                    <h4 className="text-xs font-medium mb-3">Semantic Intents (primary, danger, warning, success, neutral)</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-xs w-32" style={{ color: textMuted }}>semanticDefault:</span>
                        <input
                          type="text"
                          value={alphaConfig.semanticDefault}
                          onChange={(e) => setAlphaConfig((prev) => ({ ...prev, semanticDefault: e.target.value }))}
                          className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                          style={inputStyle}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs w-32" style={{ color: textMuted }}>on-semanticDefault:</span>
                        <input
                          type="text"
                          value={alphaConfig.onSemanticDefault}
                          onChange={(e) => setAlphaConfig((prev) => ({ ...prev, onSemanticDefault: e.target.value }))}
                          className="px-3 py-1.5 rounded border text-xs flex-1 font-mono"
                          style={inputStyle}
                        />
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
                onToggle={() => toggleSection('exclusions')}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs" style={{ color: textMuted }}>Exclusion prefix:</span>
                    <input
                      type="text"
                      value={exclusionPattern}
                      onChange={(e) => setExclusionPattern(e.target.value)}
                      className="px-3 py-1.5 rounded border text-xs w-20 font-mono"
                      style={inputStyle}
                    />
                    <span className="text-xs" style={{ color: textMuted }}>Groups starting with this prefix won't be exported</span>
                  </div>
                </div>
              </ConfigSection>
            </>
          )}

          {/* Preview & Export Section */}
          <ConfigSection
            title="Preview & Export"
            isOpen={exportSections.preview}
            onToggle={() => toggleSection('preview')}
            badge={figmaExportType === 'palette' ? 'palette' : 'semantic'}
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
