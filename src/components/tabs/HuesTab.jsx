import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { usePalette } from '../../context/PaletteContext';
import { Tooltip } from '../UI';

export function HuesTab() {
  const { theme, paletteData, inputStyle, labelStyle } = usePalette();
  const { isDark, cardBg, borderColor } = theme;
  const { hues, setHues, updateHue } = paletteData;

  return (
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
              <p className="text-xs mt-1" style={labelStyle}>
                Define color names and hue angles (0-360°). Check "Gray" for neutral grayscale.
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
                  backgroundColor: isDark ? '#333' : '#f9fafb',
                  gridTemplateColumns: '1fr 80px 50px 32px',
                }}
              >
                <input
                  type="text"
                  value={hue.name}
                  onChange={(e) => updateHue(i, 'name', e.target.value)}
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
                    onChange={(e) => updateHue(i, 'H', e.target.value)}
                    className="w-full px-2 py-1 rounded border text-sm"
                    style={inputStyle}
                  />
                </div>
                <Tooltip content="Grayscale (zero chroma)" isDark={isDark}>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hue.fullGray}
                      onChange={(e) => updateHue(i, 'fullGray', e.target.checked)}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-xs">Gray</span>
                  </label>
                </Tooltip>
                <button
                  onClick={() => setHues(hues.filter((_, idx) => idx !== i))}
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
  );
}

export default HuesTab;
