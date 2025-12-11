import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { usePaletteData } from '../hooks/usePaletteData';
import { useDisplaySettings } from '../hooks/useDisplaySettings';
import { useContrastSettings } from '../hooks/useContrastSettings';
import { useFigmaConfig } from '../hooks/useFigmaConfig';
import { useHistory, useHistoryKeyboard } from '../hooks/useHistory';
import { STORAGE_KEY } from '../config/constants';

const PaletteContext = createContext(null);

export function PaletteProvider({ children }) {
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
  const theme = useTheme();
  const paletteData = usePaletteData();
  const display = useDisplaySettings();
  const contrast = useContrastSettings();
  const figma = useFigmaConfig({
    palette: paletteData.palette,
    stops: paletteData.stops,
    hues: paletteData.hues,
    reverseInDark: theme.reverseInDark,
  });

  // History state for tracking
  const historyState = useMemo(() => ({
    stops: paletteData.stops,
    hues: paletteData.hues,
    settings: {
      bgColorLight: theme.bgColorLight,
      bgColorDark: theme.bgColorDark,
      swatchSize: display.swatchSize,
    },
  }), [paletteData.stops, paletteData.hues, theme.bgColorLight, theme.bgColorDark, display.swatchSize]);

  // History management
  const history = useHistory(historyState);

  // Apply history state
  const applyHistoryState = useCallback((state) => {
    if (state) {
      paletteData.setStops(state.stops);
      paletteData.setHues(state.hues);
      if (state.settings) {
        theme.setBgColorLight(state.settings.bgColorLight);
        theme.setBgColorDark(state.settings.bgColorDark);
        display.setSwatchSize(state.settings.swatchSize);
      }
    }
  }, [paletteData, theme, display]);

  // Undo/redo handlers
  const handleUndo = useCallback(() => {
    const state = history.undo();
    applyHistoryState(state);
  }, [history, applyHistoryState]);

  const handleRedo = useCallback(() => {
    const state = history.redo();
    applyHistoryState(state);
  }, [history, applyHistoryState]);

  // Setup keyboard shortcuts
  useHistoryKeyboard(handleUndo, handleRedo);

  // Copy to clipboard
  const copyToClipboard = useCallback((text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    paletteData.resetToDefaults();
    theme.setBgColorLight('oklch(100% 0 0)');
    theme.setBgColorDark('oklch(25% 0 0)');
    theme.setReverseInDark(true);
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

export function usePalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error('usePalette must be used within a PaletteProvider');
  }
  return context;
}

export default PaletteContext;
