/**
 * Parse alpha string like "0-30,35,40" into array of numbers [0,1,2,...,30,35,40]
 * @param {string} str - Alpha string with ranges and individual values
 * @returns {number[]} Sorted unique array of alpha values
 */
export const parseAlphaString = (str) => {
  if (!str || typeof str !== "string") return [];
  const parts = str.split(",").map((p) => p.trim());
  const result = [];
  parts.forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) result.push(i);
    } else if (part) {
      result.push(Number(part));
    }
  });
  return [...new Set(result)].sort((a, b) => a - b);
};

/**
 * Convert array of alpha values back to compact string format
 * @param {number[]} alphas - Array of alpha values
 * @returns {string} Compact string like "0-30,35,40"
 */
export const alphasToString = (alphas) => {
  if (!alphas || !alphas.length) return "";
  const sorted = [...alphas].sort((a, b) => a - b);
  const ranges = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== prev + 1) {
      if (prev === rangeStart) {
        ranges.push(`${rangeStart}`);
      } else if (prev === rangeStart + 1) {
        ranges.push(`${rangeStart},${prev}`);
      } else {
        ranges.push(`${rangeStart}-${prev}`);
      }
      rangeStart = sorted[i];
    }
    prev = sorted[i];
  }

  if (prev === rangeStart) {
    ranges.push(`${rangeStart}`);
  } else if (prev === rangeStart + 1) {
    ranges.push(`${rangeStart},${prev}`);
  } else {
    ranges.push(`${rangeStart}-${prev}`);
  }

  return ranges.join(",");
};
