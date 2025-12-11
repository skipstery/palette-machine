import { useState, useEffect } from "react";

/**
 * Custom hook for persisting state to localStorage
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if nothing in storage
 * @returns {Array} [value, setValue] - State and setter
 */
export const useLocalStorage = (key, initialValue) => {
  // Initialize state from localStorage or use initial value
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Persist to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }, [key, value]);

  return [value, setValue];
};

/**
 * Custom hook for system theme detection
 * @returns {Object} { mode, nativeColorSpace } - Current theme mode and color space
 */
export const useSystemTheme = () => {
  const [mode, setMode] = useState("light");
  const [nativeColorSpace, setNativeColorSpace] = useState("srgb");

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    // Theme detection
    const mqTheme = window.matchMedia("(prefers-color-scheme: dark)");
    setMode(mqTheme.matches ? "dark" : "light");
    const themeHandler = (e) => setMode(e.matches ? "dark" : "light");
    mqTheme.addEventListener("change", themeHandler);

    // Color space detection
    const mqP3 = window.matchMedia("(color-gamut: p3)");
    setNativeColorSpace(mqP3.matches ? "p3" : "srgb");
    const p3Handler = (e) => setNativeColorSpace(e.matches ? "p3" : "srgb");
    mqP3.addEventListener("change", p3Handler);

    return () => {
      mqTheme.removeEventListener("change", themeHandler);
      mqP3.removeEventListener("change", p3Handler);
    };
  }, []);

  return { mode, setMode, nativeColorSpace, setNativeColorSpace };
};

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Map of key combos to handlers
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = [];
      if (e.metaKey || e.ctrlKey) key.push("cmd");
      if (e.shiftKey) key.push("shift");
      if (e.altKey) key.push("alt");
      key.push(e.key.toLowerCase());

      const combo = key.join("+");
      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};
