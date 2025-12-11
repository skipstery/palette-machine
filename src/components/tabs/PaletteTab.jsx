import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { usePalette } from '../../context/PaletteContext';
import { SectionHeader, Tooltip, CopyableAttr, ContrastLabel } from '../UI';
import { cssColorToHex } from '../../utils/colorConversions';

export function PaletteTab() {
  const ctx = usePalette();
  const { theme, paletteData, display, contrast, inputStyle, labelStyle, copiedIndex, copyToClipboard } = ctx;
  const { themeOpen, setThemeOpen, colorModelOpen, setColorModelOpen, contrastOpen, setContrastOpen } = ctx;

  const { isDark, currentBg, currentBgHex, cardBg, borderColor, inputBg, textColor, textMuted, effectiveColorSpace, nativeColorSpace, previewColorSpace } = theme;
  const { palette, stops, hues, updateStop, updateHue } = paletteData;
  const {
    showOKLCH, setShowOKLCH, showSRGB, setShowSRGB, showP3, setShowP3, showGamutWarn, setShowGamutWarn,
    swatchSize, swatchTextMode, setSwatchTextMode, swatchTextShade, setSwatchTextShade,
    swatchTextCustom, setSwatchTextCustom, swatchTextAutoThreshold, setSwatchTextAutoThreshold,
    getDisplayColor, getDisplayColors, getSwatchTextColor, getAttrLabels
  } = display;
  const {
    contrastAlgo, setContrastAlgo, contrastDirection, setContrastDirection, contrastThreshold, setContrastThreshold,
    showVsWhite, setShowVsWhite, vsWhiteColor, setVsWhiteColor,
    showVsBlack, setShowVsBlack, vsBlackColor, setVsBlackColor,
    showVsBg, setShowVsBg, showVsShade, setShowVsShade, contrastShade, setContrastShade,
    getContrast, formatContrast
  } = contrast;

  const attrLabels = getAttrLabels(showVsWhite, showVsBlack, showVsBg, showVsShade, contrastShade);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 overflow-y-auto p-3 space-y-2">
        {/* Theme Section */}
        <div
          className="rounded-lg p-2.5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <SectionHeader
            title="Theme"
            isOpen={themeOpen}
            onToggle={() => setThemeOpen(!themeOpen)}
            textColor={textColor}
          />
          {themeOpen && (
            <div className="space-y-2 mt-2">
              <div
                className="flex rounded overflow-hidden"
                style={{ border: `1px solid ${borderColor}` }}
              >
                <button
                  onClick={() => theme.setMode('light')}
                  className={`flex-1 py-1 text-xs ${theme.mode === 'light' ? 'bg-blue-600 text-white' : ''}`}
                  style={theme.mode !== 'light' ? { backgroundColor: inputBg } : {}}
                >
                  Light
                </button>
                <button
                  onClick={() => theme.setMode('dark')}
                  className={`flex-1 py-1 text-xs ${theme.mode === 'dark' ? 'bg-blue-600 text-white' : ''}`}
                  style={theme.mode !== 'dark' ? { backgroundColor: inputBg } : {}}
                >
                  Dark
                </button>
              </div>
              <div className="flex gap-1.5 items-center">
                <input
                  type="color"
                  value={theme.bgColorLight}
                  onChange={(e) => theme.setBgColorLight(e.target.value)}
                  className="w-5 h-5 flex-shrink-0 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={theme.bgColorLight}
                  onChange={(e) => theme.setBgColorLight(e.target.value)}
                  className="min-w-0 flex-1 px-1.5 py-0.5 rounded text-xs font-mono border"
                  style={inputStyle}
                />
                <span className="text-xs" style={labelStyle}>L</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <input
                  type="color"
                  value={theme.bgColorDark}
                  onChange={(e) => theme.setBgColorDark(e.target.value)}
                  className="w-5 h-5 flex-shrink-0 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={theme.bgColorDark}
                  onChange={(e) => theme.setBgColorDark(e.target.value)}
                  className="min-w-0 flex-1 px-1.5 py-0.5 rounded text-xs font-mono border"
                  style={inputStyle}
                />
                <span className="text-xs" style={labelStyle}>D</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={theme.reverseInDark}
                  onChange={(e) => theme.setReverseInDark(e.target.checked)}
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
                  onChange={(e) => display.setSwatchSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Values Section */}
        <div
          className="rounded-lg p-2.5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <SectionHeader
            title="Values"
            isOpen={colorModelOpen}
            onToggle={() => setColorModelOpen(!colorModelOpen)}
            textColor={textColor}
          />
          {colorModelOpen && (
            <div className="space-y-2 mt-2">
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showOKLCH} onChange={(e) => setShowOKLCH(e.target.checked)} className="w-3.5 h-3.5" />
                  <span className="text-xs">OKLCH</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showSRGB} onChange={(e) => setShowSRGB(e.target.checked)} className="w-3.5 h-3.5" />
                  <span className="text-xs">sRGB HEX</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showP3} onChange={(e) => setShowP3(e.target.checked)} className="w-3.5 h-3.5" />
                  <span className="text-xs">P3 HEX</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showGamutWarn} onChange={(e) => setShowGamutWarn(e.target.checked)} className="w-3.5 h-3.5" />
                  <span className="text-xs">Gamut warnings</span>
                </label>
              </div>
              <div className="pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                <label className="text-xs block mb-1.5" style={labelStyle}>Swatch text color</label>
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
                {swatchTextMode === 'auto' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={labelStyle}>Switch at L:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={swatchTextAutoThreshold}
                      onChange={(e) => setSwatchTextAutoThreshold(Number(e.target.value))}
                      className="w-14 px-1.5 py-0.5 rounded text-xs border"
                      style={inputStyle}
                    />
                  </div>
                )}
                {swatchTextMode === 'shade' && (
                  <select
                    value={swatchTextShade}
                    onChange={(e) => setSwatchTextShade(e.target.value)}
                    className="w-full px-2 py-1 rounded text-xs border"
                    style={inputStyle}
                  >
                    {stops.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                )}
                {swatchTextMode === 'custom' && (
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="color"
                      value={swatchTextCustom}
                      onChange={(e) => setSwatchTextCustom(e.target.value)}
                      className="w-5 h-5 flex-shrink-0 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={swatchTextCustom}
                      onChange={(e) => setSwatchTextCustom(e.target.value)}
                      className="min-w-0 flex-1 px-1.5 py-0.5 rounded text-xs font-mono border"
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contrast Section */}
        <div
          className="rounded-lg p-2.5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <SectionHeader
            title="Contrast"
            isOpen={contrastOpen}
            onToggle={() => setContrastOpen(!contrastOpen)}
            textColor={textColor}
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
              {contrastAlgo === 'APCA' && (
                <select
                  value={contrastDirection}
                  onChange={(e) => setContrastDirection(e.target.value)}
                  className="w-full px-2 py-1 rounded text-xs border"
                  style={inputStyle}
                >
                  <option value="text-on-bg">Color = Text</option>
                  <option value="bg-under-text">Color = Background</option>
                </select>
              )}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showVsWhite} onChange={(e) => setShowVsWhite(e.target.checked)} className="w-3.5 h-3.5" />
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
                  <input type="checkbox" checked={showVsBlack} onChange={(e) => setShowVsBlack(e.target.checked)} className="w-3.5 h-3.5" />
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
                  <input type="checkbox" checked={showVsBg} onChange={(e) => setShowVsBg(e.target.checked)} className="w-3.5 h-3.5" />
                  <span className="text-xs">vs Background</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={showVsShade} onChange={(e) => setShowVsShade(e.target.checked)} className="w-3.5 h-3.5" />
                  <span className="text-xs">vs shade</span>
                  <select
                    value={contrastShade}
                    onChange={(e) => setContrastShade(e.target.value)}
                    className="w-14 px-1 py-0.5 rounded text-xs border"
                    style={inputStyle}
                    disabled={!showVsShade}
                  >
                    {stops.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              {contrastAlgo === 'APCA' && (
                <div className="pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs" style={labelStyle}>Check contrast</label>
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
                    onChange={(e) => setContrastThreshold(Number(e.target.value))}
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
            {/* Header row with stop names and L/C inputs */}
            <div
              className="sticky top-0 z-10 flex -mt-4 pt-4"
              style={{ backgroundColor: currentBg }}
            >
              <div style={{ width: 80 }} />
              {stops.map((stop, idx) => {
                const sourceIdx = isDark && theme.reverseInDark ? stops.length - 1 - idx : idx;
                const displayStop = stops[sourceIdx];
                return (
                  <div
                    key={stop.name}
                    className="text-center font-mono py-1 flex flex-col items-center"
                    style={{ minWidth: swatchSize, width: swatchSize }}
                  >
                    <span style={{ color: textColor, fontSize: 12, fontWeight: 600 }}>
                      {stop.name}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={displayStop.L}
                      onChange={(e) => updateStop(sourceIdx, 'L', e.target.value)}
                      className="w-10 text-center bg-transparent border-b font-mono focus:outline-none focus:border-blue-500"
                      style={{ color: textMuted, fontSize: 9, borderColor: 'transparent' }}
                      title="Lightness"
                    />
                    <input
                      type="number"
                      min="0"
                      max="0.4"
                      step="0.01"
                      value={displayStop.C}
                      onChange={(e) => updateStop(sourceIdx, 'C', e.target.value)}
                      className="w-10 text-center bg-transparent border-b font-mono focus:outline-none focus:border-blue-500"
                      style={{ color: textMuted, fontSize: 9, borderColor: 'transparent' }}
                      title="Chroma"
                    />
                  </div>
                );
              })}
            </div>

            {/* Palette rows */}
            <div className="space-y-3">
              {palette.map((hueSet, hueIdx) => {
                const displayColors = getDisplayColors(hueSet, isDark, theme.reverseInDark);
                return (
                  <div key={hueSet.name} className="flex">
                    {/* Hue label column */}
                    <div className="flex flex-col pr-2" style={{ width: 80 }}>
                      <div className="flex flex-col justify-center" style={{ height: swatchSize }}>
                        <span className="font-mono" style={{ color: textColor, fontSize: 12, fontWeight: 600 }}>
                          {hueSet.name}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <span className="font-mono" style={{ color: textMuted, fontSize: 9 }}>H:</span>
                          <input
                            type="number"
                            min="0"
                            max="360"
                            step="1"
                            value={hueSet.H}
                            onChange={(e) => updateHue(hueIdx, 'H', e.target.value)}
                            className="w-8 bg-transparent border-b font-mono focus:outline-none focus:border-blue-500"
                            style={{ color: textMuted, fontSize: 9, borderColor: 'transparent' }}
                            title="Hue angle"
                          />
                          <span className="font-mono" style={{ color: textMuted, fontSize: 9 }}>°</span>
                        </div>
                      </div>
                      <div className="flex flex-col py-1 gap-0.5">
                        {attrLabels.map((label, i) => (
                          <span key={i} className="text-left font-mono h-4" style={{ color: textMuted, fontSize: 9 }}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Color swatches */}
                    {displayColors.map((color, idx) => {
                      const displayColor = getDisplayColor(color, effectiveColorSpace, nativeColorSpace, previewColorSpace);
                      const swatchTextResult = getSwatchTextColor(color, displayColors);
                      const isClipped = effectiveColorSpace === 'p3' ? color.clippedP3 : color.clipped;
                      const colorHexForContrast = color.hex;

                      const contrastW = showVsWhite ? getContrast(colorHexForContrast, cssColorToHex(vsWhiteColor)) : null;
                      const contrastB = showVsBlack ? getContrast(colorHexForContrast, cssColorToHex(vsBlackColor)) : null;
                      const contrastBg = showVsBg ? getContrast(colorHexForContrast, currentBgHex) : null;
                      const contrastS = showVsShade
                        ? getContrast(colorHexForContrast, displayColors.find((c) => c.stop === contrastShade)?.hex || '#fff')
                        : null;

                      const checkThreshold = (val) =>
                        contrastThreshold === 0 || contrastAlgo !== 'APCA' || Math.abs(val) >= contrastThreshold;

                      return (
                        <div key={idx} style={{ minWidth: swatchSize, width: swatchSize }}>
                          <Tooltip content={`Click to copy ${color.hex}`} isDark={isDark}>
                            <div
                              className="cursor-pointer flex items-center justify-center relative w-full"
                              style={{ backgroundColor: displayColor, height: swatchSize }}
                              onClick={() => copyToClipboard(color.hex, `sw-${hueSet.name}-${idx}`)}
                            >
                              <span
                                className="font-mono"
                                style={{
                                  color: swatchTextResult.color,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  opacity: swatchTextResult.meetsThreshold ? 1 : 0.4,
                                  textDecoration: swatchTextResult.meetsThreshold ? 'none' : 'line-through',
                                }}
                              >
                                {color.stop}
                              </span>
                              {isClipped && showGamutWarn && (
                                <AlertTriangle
                                  className="absolute top-0.5 right-0.5 w-3 h-3"
                                  style={{ color: swatchTextResult.color }}
                                />
                              )}
                              {copiedIndex === `sw-${hueSet.name}-${idx}` && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
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
                                copiedIndex={copiedIndex}
                                onCopy={copyToClipboard}
                                textMuted={textMuted}
                                swatchSize={swatchSize}
                              />
                            )}
                            {showSRGB && (
                              <CopyableAttr
                                value={color.hex}
                                id={`sr-${hueSet.name}-${idx}`}
                                copiedIndex={copiedIndex}
                                onCopy={copyToClipboard}
                                textMuted={textMuted}
                                swatchSize={swatchSize}
                              />
                            )}
                            {showP3 && (
                              <CopyableAttr
                                value={color.hexP3}
                                id={`p3-${hueSet.name}-${idx}`}
                                copiedIndex={copiedIndex}
                                onCopy={copyToClipboard}
                                textMuted={textMuted}
                                swatchSize={swatchSize}
                              />
                            )}
                            {showVsWhite && (
                              <ContrastLabel
                                value={formatContrast(contrastW)}
                                passes={contrastThreshold > 0 && checkThreshold(contrastW)}
                                textColor={textColor}
                                textMuted={textMuted}
                                swatchSize={swatchSize}
                              />
                            )}
                            {showVsBlack && (
                              <ContrastLabel
                                value={formatContrast(contrastB)}
                                passes={contrastThreshold > 0 && checkThreshold(contrastB)}
                                textColor={textColor}
                                textMuted={textMuted}
                                swatchSize={swatchSize}
                              />
                            )}
                            {showVsBg && (
                              <ContrastLabel
                                value={formatContrast(contrastBg)}
                                passes={contrastThreshold > 0 && checkThreshold(contrastBg)}
                                textColor={textColor}
                                textMuted={textMuted}
                                swatchSize={swatchSize}
                              />
                            )}
                            {showVsShade && (
                              <ContrastLabel
                                value={formatContrast(contrastS)}
                                passes={contrastThreshold > 0 && checkThreshold(contrastS)}
                                textColor={textColor}
                                textMuted={textMuted}
                                swatchSize={swatchSize}
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
  );
}

export default PaletteTab;
