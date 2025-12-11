import { useState, useCallback } from 'react';
import {
  getContrast as getContrastUtil,
  formatContrast as formatContrastUtil,
} from '../utils/contrast';

/**
 * Hook for managing contrast settings and calculations
 */
export function useContrastSettings() {
  const [contrastAlgo, setContrastAlgo] = useState('APCA');
  const [contrastDirection, setContrastDirection] = useState('text-on-bg');
  const [contrastThreshold, setContrastThreshold] = useState(75);

  // Contrast comparison targets
  const [showVsWhite, setShowVsWhite] = useState(false);
  const [vsWhiteColor, setVsWhiteColor] = useState('#ffffff');
  const [showVsBlack, setShowVsBlack] = useState(false);
  const [vsBlackColor, setVsBlackColor] = useState('#000000');
  const [showVsBg, setShowVsBg] = useState(true);
  const [showVsShade, setShowVsShade] = useState(false);
  const [contrastShade, setContrastShade] = useState('500');

  // Wrapper for getContrast that uses component state
  const getContrast = useCallback((colorHex, compareHex) => {
    return getContrastUtil(colorHex, compareHex, contrastAlgo, contrastDirection);
  }, [contrastAlgo, contrastDirection]);

  // Wrapper for formatContrast that uses component state
  const formatContrast = useCallback((val) => {
    return formatContrastUtil(val, contrastAlgo);
  }, [contrastAlgo]);

  // Check if contrast passes threshold
  const passesThreshold = useCallback((contrastValue) => {
    return Math.abs(contrastValue) >= contrastThreshold;
  }, [contrastThreshold]);

  // Reset contrast settings to defaults
  const resetContrastSettings = useCallback(() => {
    setContrastAlgo('APCA');
    setContrastDirection('text-on-bg');
    setContrastThreshold(75);
    setShowVsWhite(false);
    setVsWhiteColor('#ffffff');
    setShowVsBlack(false);
    setVsBlackColor('#000000');
    setShowVsBg(true);
    setShowVsShade(false);
    setContrastShade('500');
  }, []);

  return {
    // State
    contrastAlgo,
    setContrastAlgo,
    contrastDirection,
    setContrastDirection,
    contrastThreshold,
    setContrastThreshold,
    showVsWhite,
    setShowVsWhite,
    vsWhiteColor,
    setVsWhiteColor,
    showVsBlack,
    setShowVsBlack,
    vsBlackColor,
    setVsBlackColor,
    showVsBg,
    setShowVsBg,
    showVsShade,
    setShowVsShade,
    contrastShade,
    setContrastShade,

    // Functions
    getContrast,
    formatContrast,
    passesThreshold,
    resetContrastSettings,
  };
}

export default useContrastSettings;
