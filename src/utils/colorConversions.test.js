import { describe, expect, it } from 'vitest';
import {
  cssColorToHex,
  hexToGrayscale,
  normalizeHex,
  oklchToColor,
  parseOklch,
} from './colorConversions';

describe('normalizeHex', () => {
  it('expands short hex and lowercases', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('FF0000')).toBe('#ff0000');
  });

  it('rejects invalid input', () => {
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex(undefined)).toBeNull();
  });
});

describe('parseOklch', () => {
  it('accepts percent and 0-1 lightness', () => {
    expect(parseOklch('oklch(62% 0.2 250)')).toEqual({ L: 62, C: 0.2, H: 250 });
    expect(parseOklch('oklch(0.62 0.2 250)')).toEqual({ L: 62, C: 0.2, H: 250 });
  });

  it('returns null for other formats', () => {
    expect(parseOklch('rgb(0 0 0)')).toBeNull();
  });
});

describe('oklchToColor', () => {
  it('converts the sRGB primaries back to their hex values', () => {
    // Reference OKLCH coordinates of pure sRGB red, green and blue
    expect(oklchToColor(62.7955, 0.257683, 29.2339).hex).toBe('#ff0000');
    expect(oklchToColor(86.644, 0.294827, 142.4953).hex).toBe('#00ff00');
    expect(oklchToColor(45.2014, 0.313214, 264.052).hex).toBe('#0000ff');
  });

  it('maps achromatic lightness to neutral grays', () => {
    expect(oklchToColor(100, 0, 0).hex).toBe('#ffffff');
    expect(oklchToColor(0, 0, 0).hex).toBe('#000000');
    expect(oklchToColor(40, 0, 0).hex).toBe('#484848');
  });

  it('flags colors outside sRGB but inside P3', () => {
    const vividGreen = oklchToColor(80, 0.3, 145);
    expect(vividGreen.clipped).toBe(true);
    expect(vividGreen.clippedP3).toBe(false);
  });

  it('flags colors outside both gamuts', () => {
    const tooVivid = oklchToColor(60, 0.4, 145);
    expect(tooVivid.clipped).toBe(true);
    expect(tooVivid.clippedP3).toBe(true);
  });
});

describe('cssColorToHex', () => {
  it('handles hex and oklch()', () => {
    expect(cssColorToHex('#FFF')).toBe('#ffffff');
    expect(cssColorToHex('oklch(100% 0 0)')).toBe('#ffffff');
    expect(cssColorToHex('oklch(25% 0 0)')).toBe('#222222');
  });

  it('falls back to black for unsupported input', () => {
    expect(cssColorToHex('hsl(0 0% 50%)')).toBe('#000000');
    expect(cssColorToHex('')).toBe('#000000');
  });
});

describe('hexToGrayscale', () => {
  it('keeps grays unchanged', () => {
    expect(hexToGrayscale('#808080')).toBe('#808080');
  });
});
