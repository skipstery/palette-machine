import { describe, expect, it } from 'vitest';
import { generatePalette } from './paletteGenerator';
import { DEFAULT_HUES, DEFAULT_STOPS } from '../config/constants';

describe('generatePalette', () => {
  const palette = generatePalette(DEFAULT_HUES, DEFAULT_STOPS);

  it('creates one color per hue and stop', () => {
    expect(palette).toHaveLength(DEFAULT_HUES.length);
    palette.forEach((hue) => {
      expect(hue.colors.map((c) => c.stop)).toEqual(DEFAULT_STOPS.map((s) => s.name));
    });
  });

  it('keeps "fullGray" hues neutral', () => {
    const gray = palette.find((h) => h.name === 'gray');
    gray.colors.forEach((c) => {
      expect(c.C).toBe(0);
      const [r, g, b] = [c.hex.slice(1, 3), c.hex.slice(3, 5), c.hex.slice(5, 7)];
      expect(r).toBe(g);
      expect(g).toBe(b);
    });
  });

  it('produces valid hex and oklch strings', () => {
    const blue500 = palette.find((h) => h.name === 'blue').colors.find((c) => c.stop === '500');
    expect(blue500.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(blue500.hexP3).toMatch(/^#[0-9a-f]{6}$/);
    expect(blue500.oklch).toBe('oklch(0.630 0.210 255)');
  });

  it('keeps lightness monotonic along the default scale', () => {
    const lightness = DEFAULT_STOPS.map((s) => s.L);
    expect([...lightness].sort((a, b) => b - a)).toEqual(lightness);
  });
});
