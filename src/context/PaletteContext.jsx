import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { usePaletteData } from '../hooks/usePaletteData';
import { useDisplaySettings } from '../hooks/useDisplaySettings';
import { useContrastSettings } from '../hooks/useContrastSettings';
import { useFigmaConfig } from '../hooks/useFigmaConfig';
import { useHistory, useHistoryKeyboard } from '../hooks/useHistory';
import { DEFAULT_SETTINGS } from '../config/constants';
import { loadSavedConfig, saveConfig } from '../utils/config';

const PaletteContext = createContext(null);

export function PaletteProvider({ children }) {
  // Config saved in localStorage from the previous session (read once)
  const [savedConfig] = useState(loadSavedConfig);

  // Clipboard state
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('palette');

  // Sidebar panel states
  const [themeOpen, setThemeOpen] = useState(true);
  const [colorModelOpen, setColorModelOpen] = useState(true);
  const [contrastOpen, setContrastOpen] = useState(true);

  // JSON editor state
  const [jsonEditValue, setJsonEditValue] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Export format
  const [exportFormat, setExportFormat] = useState('json-srgb');

  // Custom hooks
  const theme = useTheme(savedConfig.settings);
  const paletteData = usePaletteData(savedConfig);
  const display = useDisplaySettings(savedConfig.settings);
  const contrast = useContrastSettings();
  const figma = useFigmaConfig({
    palette: paletteData.palette,
    stops: paletteData.stops,
    hues: paletteData.hues,
    reverseInDark: theme.reverseInDark,
  });

  // Serializable config: persisted, tracked by undo/redo, shown in the JSON tab
  const currentConfig = useMemo(() => ({
    stops: paletteData.stops,
    hues: paletteData.hues,
    settings: {
      bgColorLight: theme.bgColorLight,
      bgColorDark: theme.bgColorDark,
      swatchSize: display.swatchSize,
      reverseInDark: theme.reverseInDark,
    },
  }), [paletteData.stops, paletteData.hues, theme.bgColorLight, theme.bgColorDark, display.swatchSize, theme.reverseInDark]);

  // Persist to localStorage
  useEffect(() => {
    saveConfig(currentConfig);
  }, [currentConfig]);

  // History management
  const history = useHistory(currentConfig);

  // Apply a (validated) config - used by undo/redo and JSON import
  const { setStops, setHues, setTokens } = paletteData;
  const { setBgColorLight, setBgColorDark, setReverseInDark } = theme;
  const { setSwatchSize } = display;
  const applyConfig = useCallback((config) => {
    if (!config) return;
    if (config.stops) setStops(config.stops);
    if (config.hues) setHues(config.hues);
    if (config.tokens) setTokens(config.tokens);
    const settings = config.settings ?? {};
    if (settings.bgColorLight) setBgColorLight(settings.bgColorLight);
    if (settings.bgColorDark) setBgColorDark(settings.bgColorDark);
    if (settings.swatchSize) setSwatchSize(settings.swatchSize);
    if (typeof settings.reverseInDark === 'boolean') setReverseInDark(settings.reverseInDark);
  }, [setStops, setHues, setTokens, setBgColorLight, setBgColorDark, setSwatchSize, setReverseInDark]);

  // Undo/redo handlers
  const handleUndo = useCallback(() => {
    applyConfig(history.undo());
  }, [history, applyConfig]);

  const handleRedo = useCallback(() => {
    applyConfig(history.redo());
  }, [history, applyConfig]);

  // Setup keyboard shortcuts
  useHistoryKeyboard(handleUndo, handleRedo);

  // Copy to clipboard
  const copyToClipboard = useCallback((text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  // Reset to defaults (the persistence effect then saves the defaults)
  const resetToDefaults = useCallback(() => {
    paletteData.resetToDefaults();
    theme.setBgColorLight(DEFAULT_SETTINGS.bgColorLight);
    theme.setBgColorDark(DEFAULT_SETTINGS.bgColorDark);
    theme.setReverseInDark(DEFAULT_SETTINGS.reverseInDark);
    display.resetDisplaySettings();
    contrast.resetContrastSettings();
    history.resetHistory();
  }, [paletteData, theme, display, contrast, history]);

  // Derived styles
  const inputStyle = {
    backgroundColor: theme.inputBg,
    borderColor: theme.borderColor,
    color: theme.textColor,
  };
  const labelStyle = { color: theme.textMuted };

  const value = {
    // Clipboard
    copiedIndex,
    setCopiedIndex,
    copyToClipboard,

    // Tab
    activeTab,
    setActiveTab,

    // Panel states
    themeOpen,
    setThemeOpen,
    colorModelOpen,
    setColorModelOpen,
    contrastOpen,
    setContrastOpen,

    // JSON editor
    jsonEditValue,
    setJsonEditValue,
    jsonError,
    setJsonError,

    // Export
    exportFormat,
    setExportFormat,

    // Serializable config
    currentConfig,
    applyConfig,

    // Hooks
    theme,
    paletteData,
    display,
    contrast,
    figma,
    history,

    // Undo/redo
    handleUndo,
    handleRedo,

    // Actions
    resetToDefaults,

    // Styles
    inputStyle,
    labelStyle,
  };

  return (
    <PaletteContext.Provider value={value}>
      {children}
    </PaletteContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error('usePalette must be used within a PaletteProvider');
  }
  return context;
}

