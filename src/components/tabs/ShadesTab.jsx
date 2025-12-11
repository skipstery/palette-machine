import React from 'react';
import { usePalette } from '../../context/PaletteContext';
import { Tooltip } from '../UI';

export function ShadesTab() {
  const { theme, paletteData, inputStyle, labelStyle } = usePalette();
  const { isDark, cardBg, borderColor } = theme;
  const { stops, updateStop } = paletteData;

  return (
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
          <p className="text-xs mb-4" style={labelStyle}>
            Define the lightness (L) and base chroma (C) for each shade level.
          </p>
          <div className="space-y-1.5">
            {stops.map((stop, i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-2 items-center p-2 rounded"
                style={{ backgroundColor: isDark ? '#333' : '#f9fafb' }}
              >
                <input
                  type="text"
                  value={stop.name}
                  onChange={(e) => updateStop(i, 'name', e.target.value)}
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
                    onChange={(e) => updateStop(i, 'L', e.target.value)}
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
                    onChange={(e) => updateStop(i, 'C', e.target.value)}
                    className="w-full px-2 py-1 rounded border text-sm"
                    style={inputStyle}
                  />
                </div>
                <Tooltip content={`oklch(${stop.L}% ${stop.C} 250)`} isDark={isDark}>
                  <div
                    className="h-6 w-full rounded"
                    style={{
                      backgroundColor: `oklch(${stop.L}% ${stop.C} 250)`,
                    }}
                  />
                </Tooltip>
                <Tooltip content={`oklch(${stop.L}% 0 0) - Grayscale`} isDark={isDark}>
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
  );
}

export default ShadesTab;
