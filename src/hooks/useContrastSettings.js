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
  const [contrastThreshold, setContrastThreshold] = useState(75); // APCA Lc
  const [wcagThreshold, setWcagThreshold] = useState(4.5); // WCAG ratio

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

  // Check if contrast passes the threshold of the active algorithm (0 = no check)
  const passesThreshold = useCallback((contrastValue) => {
    const threshold = contrastAlgo === 'APCA' ? contrastThreshold : wcagThreshold;
    return threshold > 0 && Math.abs(contrastValue) >= threshold;
  }, [contrastAlgo, contrastThreshold, wcagThreshold]);

  // Reset contrast settings to defaults
  const resetContrastSettings = useCallback(() => {
    setContrastAlgo('APCA');
    setContrastDirection('text-on-bg');
    setContrastThreshold(75);
    setWcagThreshold(4.5);
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
    wcagThreshold,
    setWcagThreshold,
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
