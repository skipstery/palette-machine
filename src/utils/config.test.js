import { describe, expect, it } from 'vitest';
import { normalizeConfig } from './config';
import { DEFAULT_HUES, DEFAULT_STOPS } from '../config/constants';

describe('normalizeConfig', () => {
  it('accepts a full valid config', () => {
    const config = {
      stops: DEFAULT_STOPS,
      hues: DEFAULT_HUES,
      settings: { bgColorLight: '#ffffff', bgColorDark: '#111111', swatchSize: 80, reverseInDark: false },
    };
    expect(normalizeConfig(config)).toEqual(config);
  });

  it('accepts partial configs', () => {
    expect(normalizeConfig({ hues: [{ name: 'brand', H: 250 }] })).toEqual({
      hues: [{ name: 'brand', H: 250, fullGray: false }],
    });
  });

  it('coerces numeric stop names to strings', () => {
    const { stops } = normalizeConfig({ stops: [{ name: 500, L: 60, C: 0.2 }] });
    expect(stops[0].name).toBe('500');
  });

  it('clamps swatch size to the slider range', () => {
    expect(normalizeConfig({ settings: { swatchSize: 500 } }).settings.swatchSize).toBe(100);
  });

  it.each([
    [null, 'Config must be a JSON object'],
    [[], 'Config must be a JSON object'],
    [{ stops: [] }, 'stops must be a non-empty array'],
    [{ stops: [{ name: '500', L: '60', C: 0.2 }] }, 'stops[0].L must be a number'],
    [{ hues: [{ name: '', H: 10 }] }, 'hues[0].name must be a non-empty string'],
    [{ hues: [{ name: 'a', H: 1 }, { name: 'a', H: 2 }] }, 'Duplicate hue name "a"'],
  ])('rejects %j', (config, message) => {
    expect(() => normalizeConfig(config)).toThrow(message);
  });
});
