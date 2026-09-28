import { describe, expect, it } from 'vitest';
import { generateFigmaPalette, generateFigmaSemanticTokens } from './figmaExport';
import { generatePalette } from '../utils/paletteGenerator';
import {
  DEFAULT_ALPHA_CONFIG,
  DEFAULT_FIGMA_OPTIONS,
  DEFAULT_HUES,
  DEFAULT_STOPS,
} from '../config/constants';

const palette = generatePalette(DEFAULT_HUES, DEFAULT_STOPS);

const semanticOptions = (overrides = {}) => ({
  ...DEFAULT_FIGMA_OPTIONS,
  palette,
  stops: DEFAULT_STOPS,
  alphaConfig: DEFAULT_ALPHA_CONFIG,
  themeShadeSourceMap: {},
  reverseInDark: true,
  figmaColorProfile: 'srgb',
  ...overrides,
});

const paletteOptions = {
  palette,
  figmaColorProfile: 'srgb',
  shadeSourceMap: {},
  hueMapping: {},
  paletteScopes: [],
  alphaConfig: DEFAULT_ALPHA_CONFIG,
};

describe('generateFigmaPalette', () => {
  const result = JSON.parse(generateFigmaPalette(paletteOptions));

  it('creates a flat --hue-shade variable for every color', () => {
    const blue500 = palette.find((h) => h.name === 'blue').colors.find((c) => c.stop === '500');
    expect(result['--blue-500'].$type).toBe('color');
    expect(result['--blue-500'].$value.hex).toBe(blue500.hex.toUpperCase());
    expect(Object.keys(result).filter((k) => k.startsWith('--'))).toHaveLength(
      DEFAULT_HUES.length * DEFAULT_STOPS.length
    );
  });

  it('keeps variable IDs from an existing file', () => {
    const existing = JSON.stringify({
      '--blue-500': { $extensions: { 'com.figma.variableId': 'VariableID:1:23' } },
    });
    const updated = JSON.parse(
      generateFigmaPalette({ ...paletteOptions, shadeSourceMap: { 500: '500' } }, existing)
    );
    expect(updated['--blue-500'].$extensions['com.figma.variableId']).toBe('VariableID:1:23');
  });
});

describe('generateFigmaSemanticTokens', () => {
  const light = JSON.parse(generateFigmaSemanticTokens('light', semanticOptions()));
  const dark = JSON.parse(generateFigmaSemanticTokens('dark', semanticOptions()));

  it('aliases ground to the configured gray shade per mode', () => {
    expect(light.ground.$root.$value).toBe('{--gray-0}');
    expect(dark.ground.$root.$value).toBe('{--gray-1000}');
  });

  it('writes CSS-style code syntax for on-color alphas', () => {
    const syntax = (token) => token.$extensions['com.figma.codeSyntax'].WEB;
    expect(syntax(light.on.ground['15'])).toBe('on-ground/15');
    expect(syntax(light.on.stark['15'])).toBe('on-stark/15');
    expect(syntax(light.on.primary['15'])).toBe('on-primary/15');
  });

  it('converts stark OKLCH values to real sRGB colors', () => {
    // oklch(40% 0 0) is #484848 in sRGB, not 40% gray (#666666)
    expect(light.stark.shade['500'].$value.hex).toBe('#484848');
  });

  it('reverses intent shades in dark mode', () => {
    expect(light.primary.shade['100'].$value).toBe('{--blue-100}');
    expect(dark.primary.shade['100'].$value).toBe('{--blue-900}');
  });

  it('keeps the mode name', () => {
    expect(light.mode_name.$value).toBe('light');
    expect(dark.mode_name.$value).toBe('dark');
  });
});
