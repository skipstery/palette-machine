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

export const copyToClipboard = (text, setCopiedIndex, index) => {
  navigator.clipboard.writeText(text);
  setCopiedIndex(index);
  setTimeout(() => setCopiedIndex(null), 2000);
};

export const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const countTokens = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    let count = 0;
    const traverse = (obj) => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === "object") {
          if (obj[key].$type === "color") {
            count++;
          } else {
            traverse(obj[key]);
          }
        }
      }
    };
    if (data.collections) {
      data.collections.forEach((col) => {
        if (col.modes) {
          col.modes.forEach((mode) => {
            if (mode.variables) {
              mode.variables.forEach(() => count++);
            }
          });
        }
      });
    } else {
      traverse(data);
    }
    return count;
  } catch {
    return 0;
  }
};
