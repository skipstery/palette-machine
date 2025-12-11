import { useState, useEffect } from 'react';

/**
 * A hook that syncs state with localStorage
 * @param {string} key - localStorage key
 * @param {any} defaultValue - default value if nothing in localStorage
 * @returns {[any, function]} - state and setter like useState
 */
export function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(`Failed to load ${key} from localStorage:`, e);
    }
    // Return deep copy of default if it's an object/array
    return typeof defaultValue === 'object' && defaultValue !== null
      ? JSON.parse(JSON.stringify(defaultValue))
      : defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`Failed to save ${key} to localStorage:`, e);
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;
