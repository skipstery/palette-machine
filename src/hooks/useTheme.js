import { useState, useEffect, useMemo } from 'react';
import { cssColorToHex } from '../utils/colorConversions';
import { DEFAULT_SETTINGS } from '../config/constants';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const P3_QUERY = '(color-gamut: p3)';

const matches = (query) =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(query).matches
    : false;

/**
 * Hook for managing theme state (light/dark mode, backgrounds, color spaces)
 * @param {Object} initialSettings - Saved settings to start from
 */
export function useTheme(initialSettings = {}) {
  const [mode, setMode] = useState(() => (matches(DARK_QUERY) ? 'dark' : 'light'));
  const [bgColorLight, setBgColorLight] = useState(
    initialSettings.bgColorLight ?? DEFAULT_SETTINGS.bgColorLight
  );
  const [bgColorDark, setBgColorDark] = useState(
    initialSettings.bgColorDark ?? DEFAULT_SETTINGS.bgColorDark
  );
  const [reverseInDark, setReverseInDark] = useState(
    initialSettings.reverseInDark ?? DEFAULT_SETTINGS.reverseInDark
  );
  const [nativeColorSpace, setNativeColorSpace] = useState(() =>
    matches(P3_QUERY) ? 'p3' : 'srgb'
  );
  const [previewColorSpace, setPreviewColorSpace] = useState('native');

  // Follow system theme and display gamut changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mqTheme = window.matchMedia(DARK_QUERY);
      const handler = (e) => setMode(e.matches ? 'dark' : 'light');
      mqTheme.addEventListener('change', handler);

      const mqP3 = window.matchMedia(P3_QUERY);
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
