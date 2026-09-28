import { describe, expect, it } from 'vitest';
import { alphasToString, parseAlphaString } from './helpers';

describe('parseAlphaString', () => {
  it('expands ranges and single values', () => {
    expect(parseAlphaString('0-3,5, 10')).toEqual([0, 1, 2, 3, 5, 10]);
  });

  it('dedupes and sorts', () => {
    expect(parseAlphaString('10,5,5,1-2')).toEqual([1, 2, 5, 10]);
  });

  it('handles empty input', () => {
    expect(parseAlphaString('')).toEqual([]);
    expect(parseAlphaString(undefined)).toEqual([]);
  });
});

describe('alphasToString', () => {
  it('compacts consecutive runs into ranges', () => {
    expect(alphasToString([0, 1, 2, 3, 5, 10, 11])).toBe('0-3,5,10,11');
  });

  it('round-trips with parseAlphaString', () => {
    const str = '0-30,35,40,45,50,55,60,65,70-99';
    expect(alphasToString(parseAlphaString(str))).toBe(str);
  });
});
