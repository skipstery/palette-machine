import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_STOPS, DEFAULT_HUES, DEFAULT_TOKENS } from '../config/constants';
import { generatePalette } from '../utils/paletteGenerator';

const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * Hook for managing palette data (stops, hues, tokens)
 * @param {Object} initial - Saved { stops, hues, tokens } to start from
 */
export function usePaletteData(initial = {}) {
  const [stops, setStops] = useState(() => initial.stops ?? clone(DEFAULT_STOPS));
  const [hues, setHues] = useState(() => initial.hues ?? clone(DEFAULT_HUES));
  const [tokens, setTokens] = useState(() => initial.tokens ?? clone(DEFAULT_TOKENS));

  // Generate palette from hues and stops
  const palette = useMemo(() => generatePalette(hues, stops), [hues, stops]);

  // Update a single stop field
  const updateStop = useCallback((i, field, val) => {
    setStops((prev) =>
      prev.map((stop, idx) =>
        idx === i
          ? { ...stop, [field]: field === 'name' ? val : parseFloat(val) || 0 }
          : stop
      )
    );
  }, []);

  // Update a single hue field
  const updateHue = useCallback((i, field, val) => {
    setHues((prev) =>
      prev.map((hue, idx) =>
        idx === i
          ? {
              ...hue,
              [field]:
                field === 'name'
                  ? val
                  : field === 'fullGray'
                  ? val
                  : parseFloat(val) || 0,
            }
          : hue
      )
    );
  }, []);

  // Add a new hue with a unique name
  const addHue = useCallback(() => {
    setHues((prev) => {
      let n = prev.length + 1;
      while (prev.some((h) => h.name === `hue-${n}`)) n++;
      return [...prev, { name: `hue-${n}`, H: 0, fullGray: false }];
    });
  }, []);

  // Remove a hue by index
  const removeHue = useCallback((index) => {
    setHues((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setStops(clone(DEFAULT_STOPS));
    setHues(clone(DEFAULT_HUES));
    setTokens(clone(DEFAULT_TOKENS));
  }, []);

  // Statistics
  const stats = useMemo(() => {
    let totalColors = 0;
    let clippedColors = 0;
    palette.forEach((hue) => {
      hue.colors.forEach((color) => {
        totalColors++;
        if (color.clipped) clippedColors++;
      });
    });
    return {
      totalColors,
      clippedColors,
      hueCount: hues.length,
      shadeCount: stops.length,
    };
  }, [palette, hues.length, stops.length]);

  return {
    // State
    stops,
    setStops,
    hues,
    setHues,
    tokens,
    setTokens,

    // Derived
    palette,
    stats,

    // Actions
    updateStop,
    updateHue,
    addHue,
    removeHue,
    resetToDefaults,
  };
}

export default usePaletteData;
