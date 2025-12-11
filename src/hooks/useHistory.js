import { useState, useRef, useEffect, useCallback } from "react";
import { MAX_HISTORY } from "../config/constants";

/**
 * Custom hook for undo/redo functionality with history management
 * @param {Object} initialState - Initial state object
 * @param {number} debounceMs - Debounce time for tracking changes (default: 300ms)
 * @returns {Object} History management functions and state
 */
export const useHistory = (initialState, debounceMs = 300) => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  // Keep refs in sync
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  // Get current state snapshot
  const getStateSnapshot = useCallback((state) => {
    return JSON.parse(JSON.stringify(state));
  }, []);

  // Push to history
  const pushToHistory = useCallback((snapshot) => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }

    const currentIndex = historyIndexRef.current;
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(snapshot);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(currentIndex + 1);
  }, []);

  // Track changes with debounce
  useEffect(() => {
    if (!initialState) return;

    const snapshot = getStateSnapshot(initialState);
    const timer = setTimeout(() => pushToHistory(snapshot), debounceMs);
    return () => clearTimeout(timer);
  }, [initialState, debounceMs, getStateSnapshot, pushToHistory]);

  // Undo function
  const undo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex > 0) {
      isUndoRedo.current = true;
      const newIndex = currentIndex - 1;
      setHistoryIndex(newIndex);
      return historyRef.current[newIndex];
    }
    return null;
  }, []);

  // Redo function
  const redo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    const maxIndex = historyRef.current.length - 1;
    if (currentIndex < maxIndex) {
      isUndoRedo.current = true;
      const newIndex = currentIndex + 1;
      setHistoryIndex(newIndex);
      return historyRef.current[newIndex];
    }
    return null;
  }, []);

  // Reset history
  const resetHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  // Can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    historySize: history.length,
    currentIndex: historyIndex,
  };
};

/**
 * Setup keyboard shortcuts for undo/redo
 * @param {Function} onUndo - Callback for undo action
 * @param {Function} onRedo - Callback for redo action
 */
export const useHistoryKeyboard = (onUndo, onRedo) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+Z or Ctrl+Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }
      // Cmd+Shift+Z or Ctrl+Y for redo
      if (
        ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) ||
        (e.ctrlKey && e.key === "y")
      ) {
        e.preventDefault();
        onRedo?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo]);
};
