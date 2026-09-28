import { describe, expect, it } from 'vitest';
import { generateExport } from './exportGenerators';
import { generatePalette } from '../utils/paletteGenerator';

const stops = [
  { name: '100', L: 90, C: 0.05 },
  { name: '500', L: 60, C: 0.2 },
];
const hues = [
  { name: 'gray', H: 0, fullGray: true },
  { name: 'blue', H: 255, fullGray: false },
];
const tokens = { primary: 'blue', missing: 'nope' };
const palette = generatePalette(hues, stops);
const blue500 = palette[1].colors[1];

describe('generateExport', () => {
  it('exports JSON with one value per stop', () => {
    const json = JSON.parse(generateExport(palette, stops, tokens, 'json-srgb'));
    expect(json.tones).toEqual(['100', '500']);
    expect(json.hues[1]).toEqual({ name: 'blue', hue: 255, colors: palette[1].colors.map((c) => c.hex) });
    expect(json.tokens.primary).toEqual(json.hues[1].colors);
    expect(json.tokens.missing).toEqual([]);
  });

  it('uses the requested color format in JSON', () => {
    const p3 = JSON.parse(generateExport(palette, stops, tokens, 'json-p3'));
    const oklch = JSON.parse(generateExport(palette, stops, tokens, 'json-oklch'));
    expect(p3.hues[1].colors[1]).toBe(blue500.hexP3);
    expect(oklch.hues[1].colors[1]).toBe(blue500.oklch);
  });

  it('exports CSS variables with semantic aliases', () => {
    const css = generateExport(palette, stops, tokens, 'css');
    expect(css).toContain(`--color-blue-500: ${blue500.hex};`);
    expect(css).toContain('--primary-500: var(--color-blue-500);');
    expect(css).not.toContain('--missing-');
  });

  it('exports a Tailwind v4 @theme block', () => {
    const css = generateExport(palette, stops, tokens, 'tailwind-v4');
    expect(css.startsWith('@theme {')).toBe(true);
    expect(css).toContain(`--color-blue-500: ${blue500.oklch};`);
  });

  it('exports a Tailwind v3 config', () => {
    const js = generateExport(palette, stops, tokens, 'tailwind');
    expect(js).toContain(`'500': '${blue500.hex}'`);
  });

  it('exports SCSS variables', () => {
    const scss = generateExport(palette, stops, tokens, 'scss');
    expect(scss).toContain(`$blue-500: ${blue500.hex};`);
    expect(scss).toContain('$primary-500: $blue-500;');
  });
});
