import { useState, useCallback } from 'react';
import { hexToRgb, hexToGrayscale } from '../utils/colorConversions';
import { calculateAPCA } from '../utils/contrast';

/**
 * Hook for managing display settings (color model visibility, swatch text, etc.)
 */
export function useDisplaySettings() {
  // Color model visibility
  const [showOKLCH, setShowOKLCH] = useState(false);
  const [showSRGB, setShowSRGB] = useState(true);
  const [showP3, setShowP3] = useState(false);
  const [showGamutWarn, setShowGamutWarn] = useState(true);

  // Preview settings
  const [grayscalePreview, setGrayscalePreview] = useState(false);
  const [swatchSize, setSwatchSize] = useState(72);

  // Swatch text settings
  const [swatchTextMode, setSwatchTextMode] = useState('auto'); // 'auto', 'shade', 'custom', 'fluent', 'body', 'large', 'spot'
  const [swatchTextShade, setSwatchTextShade] = useState('950');
  const [swatchTextCustom, setSwatchTextCustom] = useState('#ffffff');
  const [swatchTextAutoThreshold, setSwatchTextAutoThreshold] = useState(55);

  // Get display color based on color space and grayscale mode
  const getDisplayColor = useCallback((color, effectiveColorSpace, nativeColorSpace, previewColorSpace) => {
    if (grayscalePreview) {
      return hexToGrayscale(color.hex);
    }

    if (effectiveColorSpace === 'p3' && nativeColorSpace === 'p3') {
      return color.oklch;
    } else if (previewColorSpace === 'srgb' && nativeColorSpace === 'p3') {
      const rgb = hexToRgb(color.hex);
      return `color(srgb ${rgb.r.toFixed(4)} ${rgb.g.toFixed(4)} ${rgb.b.toFixed(4)})`;
    } else {
      return color.hex;
    }
  }, [grayscalePreview]);

  // Get colors for display - if reverseInDark, map each shade position to the opposite shade's color
  const getDisplayColors = useCallback((hueSet, isDark, reverseInDark) => {
    if (isDark && reverseInDark) {
      return hueSet.colors.map((color, idx) => {
        const invertedColor = hueSet.colors[hueSet.colors.length - 1 - idx];
        return {
          ...invertedColor,
          stop: color.stop,
          originalStop: invertedColor.stop,
        };
      });
    }
    return hueSet.colors;
  }, []);

  // Get text color for swatch based on mode
  const getSwatchTextColor = useCallback((color, hueColors) => {
    if (swatchTextMode === 'auto') {
      return {
        color: color.L > swatchTextAutoThreshold ? '#000000' : '#ffffff',
        meetsThreshold: true,
      };
    }
    if (swatchTextMode === 'shade') {
      const shadeColor = hueColors.find((c) => c.stop === swatchTextShade);
      return {
        color: shadeColor ? shadeColor.hex : '#000000',
        meetsThreshold: true,
      };
    }
    if (swatchTextMode === 'custom') {
      return { color: swatchTextCustom, meetsThreshold: true };
    }

    // Suitability-based modes
    const minContrast = {
      fluent: 90,
      body: 75,
      large: 60,
      spot: 45,
    }[swatchTextMode] || 60;

    const whiteOnBg = Math.abs(calculateAPCA('#ffffff', color.hex));
    const blackOnBg = Math.abs(calculateAPCA('#000000', color.hex));

    const bestColor = whiteOnBg > blackOnBg ? '#ffffff' : '#000000';
    const bestContrast = Math.max(whiteOnBg, blackOnBg);

    return {
      color: bestColor,
      meetsThreshold: bestContrast >= minContrast,
    };
  }, [swatchTextMode, swatchTextShade, swatchTextCustom, swatchTextAutoThreshold]);

  // Get attribute labels for display
  const getAttrLabels = useCallback((showVsWhite, showVsBlack, showVsBg, showVsShade, contrastShade) => {
    const labels = [];
    if (showOKLCH) labels.push('OKLCH');
    if (showSRGB) labels.push('HEX');
    if (showP3) labels.push('P3');
    if (showVsWhite) labels.push('vs White');
    if (showVsBlack) labels.push('vs Black');
    if (showVsBg) labels.push('vs Bg');
    if (showVsShade) labels.push(`vs ${contrastShade}`);
    return labels;
  }, [showOKLCH, showSRGB, showP3]);

  // Reset display settings to defaults
  const resetDisplaySettings = useCallback(() => {
    setShowOKLCH(false);
    setShowSRGB(true);
    setShowP3(false);
    setShowGamutWarn(true);
    setGrayscalePreview(false);
    setSwatchSize(72);
    setSwatchTextMode('auto');
    setSwatchTextShade('950');
    setSwatchTextCustom('#ffffff');
    setSwatchTextAutoThreshold(55);
  }, []);

  return {
    // State
    showOKLCH,
    setShowOKLCH,
    showSRGB,
    setShowSRGB,
    showP3,
    setShowP3,
    showGamutWarn,
    setShowGamutWarn,
    grayscalePreview,
    setGrayscalePreview,
    swatchSize,
    setSwatchSize,
    swatchTextMode,
    setSwatchTextMode,
    swatchTextShade,
    setSwatchTextShade,
    swatchTextCustom,
    setSwatchTextCustom,
    swatchTextAutoThreshold,
    setSwatchTextAutoThreshold,

    // Functions
    getDisplayColor,
    getDisplayColors,
    getSwatchTextColor,
    getAttrLabels,
    resetDisplaySettings,
  };
}

export default useDisplaySettings;
