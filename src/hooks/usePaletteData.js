import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_STOPS, DEFAULT_HUES, DEFAULT_TOKENS } from '../config/constants';
import { generatePalette } from '../utils/paletteGenerator';

/**
 * Hook for managing palette data (stops, hues, tokens)
 */
export function usePaletteData() {
  const [stops, setStops] = useState(() =>
    JSON.parse(JSON.stringify(DEFAULT_STOPS))
  );
  const [hues, setHues] = useState(() =>
    JSON.parse(JSON.stringify(DEFAULT_HUES))
  );
  const [tokens, setTokens] = useState(() =>
    JSON.parse(JSON.stringify(DEFAULT_TOKENS))
  );

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

  // Add a new hue
  const addHue = useCallback(() => {
    setHues((prev) => [
      ...prev,
      { name: `color-${prev.length + 1}`, H: 0, fullGray: false },
    ]);
  }, []);

  // Remove a hue by index
  const removeHue = useCallback((index) => {
    setHues((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add a new stop
  const addStop = useCallback(() => {
    setStops((prev) => [
      ...prev,
      { name: `${(prev.length + 1) * 100}`, L: 50, C: 0.1 },
    ]);
  }, []);

  // Remove a stop by index
  const removeStop = useCallback((index) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setStops(JSON.parse(JSON.stringify(DEFAULT_STOPS)));
    setHues(JSON.parse(JSON.stringify(DEFAULT_HUES)));
    setTokens(JSON.parse(JSON.stringify(DEFAULT_TOKENS)));
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
    addStop,
    removeStop,
    resetToDefaults,
  };
}

export default usePaletteData;
