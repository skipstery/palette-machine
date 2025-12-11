import { useState, useEffect, useMemo } from 'react';
import { cssColorToHex } from '../utils/colorConversions';

/**
 * Hook for managing theme state (light/dark mode, backgrounds, color spaces)
 */
export function useTheme() {
  const [mode, setMode] = useState('light');
  const [bgColorLight, setBgColorLight] = useState('oklch(100% 0 0)');
  const [bgColorDark, setBgColorDark] = useState('oklch(25% 0 0)');
  const [reverseInDark, setReverseInDark] = useState(true);
  const [nativeColorSpace, setNativeColorSpace] = useState('srgb');
  const [previewColorSpace, setPreviewColorSpace] = useState('native');

  // System theme detection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mqTheme = window.matchMedia('(prefers-color-scheme: dark)');
      setMode(mqTheme.matches ? 'dark' : 'light');
      const handler = (e) => setMode(e.matches ? 'dark' : 'light');
      mqTheme.addEventListener('change', handler);

      const mqP3 = window.matchMedia('(color-gamut: p3)');
      setNativeColorSpace(mqP3.matches ? 'p3' : 'srgb');
      const p3Handler = (e) => setNativeColorSpace(e.matches ? 'p3' : 'srgb');
      mqP3.addEventListener('change', p3Handler);

      return () => {
        mqTheme.removeEventListener('change', handler);
        mqP3.removeEventListener('change', p3Handler);
      };
    }
  }, []);

  // Derived values
  const isDark = mode === 'dark';
  const currentBg = isDark ? bgColorDark : bgColorLight;
  const currentBgHex = cssColorToHex(currentBg);
  const effectiveColorSpace = previewColorSpace === 'native' ? nativeColorSpace : previewColorSpace;

  // Theme colors
  const colors = useMemo(() => ({
    textColor: isDark ? '#f5f5f5' : '#171717',
    textMuted: isDark ? '#737373' : '#a3a3a3',
    cardBg: isDark ? '#262626' : '#ffffff',
    inputBg: isDark ? '#333333' : '#ffffff',
    borderColor: isDark ? '#404040' : '#e5e5e5',
    headerBg: isDark ? '#1f1f1f' : '#f5f5f5',
  }), [isDark]);

  return {
    // State
    mode,
    setMode,
    bgColorLight,
    setBgColorLight,
    bgColorDark,
    setBgColorDark,
    reverseInDark,
    setReverseInDark,
    nativeColorSpace,
    setNativeColorSpace,
    previewColorSpace,
    setPreviewColorSpace,

    // Derived
    isDark,
    currentBg,
    currentBgHex,
    effectiveColorSpace,
    ...colors,
  };
}

export default useTheme;
