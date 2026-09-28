import { describe, expect, it } from 'vitest';
import { calculateAPCA, calculateWCAG, getContrast, formatContrast } from './contrast';

describe('calculateAPCA', () => {
  // Reference values from the APCA-W3 (0.0.98G-4g) test suite
  it.each([
    ['#000000', '#ffffff', 106.04067],
    ['#ffffff', '#000000', -107.88473],
    ['#888888', '#ffffff', 63.05647],
    ['#ffffff', '#888888', -68.54146],
    ['#000000', '#aaaaaa', 58.14626],
    ['#aaaaaa', '#000000', -56.24113],
    ['#112233', '#ddeeff', 91.66831],
    ['#ddeeff', '#112233', -93.06770],
  ])('text %s on %s = Lc %d', (text, bg, expected) => {
    expect(calculateAPCA(text, bg)).toBeCloseTo(expected, 4);
  });

  it('returns 0 for identical colors', () => {
    expect(calculateAPCA('#777777', '#777777')).toBe(0);
  });
});

describe('calculateWCAG', () => {
  it('is 21:1 for black on white', () => {
    expect(calculateWCAG('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('is symmetric', () => {
    expect(calculateWCAG('#767676', '#ffffff')).toBeCloseTo(
      calculateWCAG('#ffffff', '#767676'),
      10
    );
  });

  it('puts #767676 on white just above AA (4.5:1)', () => {
    expect(calculateWCAG('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });
});

describe('getContrast', () => {
  it('treats the color as text or background depending on direction', () => {
    expect(getContrast('#000000', '#ffffff', 'APCA', 'text-on-bg')).toBeCloseTo(106.04, 2);
    expect(getContrast('#000000', '#ffffff', 'APCA', 'bg-under-text')).toBeCloseTo(-107.88, 2);
  });

  it('returns 0 when a color is missing', () => {
    expect(getContrast(null, '#ffffff', 'APCA', 'text-on-bg')).toBe(0);
  });
});

describe('formatContrast', () => {
  it('formats APCA as absolute Lc and WCAG as a ratio', () => {
    expect(formatContrast(-107.88, 'APCA')).toBe('108');
    expect(formatContrast(4.543, 'WCAG')).toBe('4.5');
  });
});
