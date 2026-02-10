/**
 * Zodiac constants — symbols, elements, qualities, planet glyphs.
 */

export const zodiacSigns = {
  Aries: { symbol: '♈', element: 'fire', quality: 'cardinal' },
  Taurus: { symbol: '♉', element: 'earth', quality: 'fixed' },
  Gemini: { symbol: '♊', element: 'air', quality: 'mutable' },
  Cancer: { symbol: '♋', element: 'water', quality: 'cardinal' },
  Leo: { symbol: '♌', element: 'fire', quality: 'fixed' },
  Virgo: { symbol: '♍', element: 'earth', quality: 'mutable' },
  Libra: { symbol: '♎', element: 'air', quality: 'cardinal' },
  Scorpio: { symbol: '♏', element: 'water', quality: 'fixed' },
  Sagittarius: { symbol: '♐', element: 'fire', quality: 'mutable' },
  Capricorn: { symbol: '♑', element: 'earth', quality: 'cardinal' },
  Aquarius: { symbol: '♒', element: 'air', quality: 'fixed' },
  Pisces: { symbol: '♓', element: 'water', quality: 'mutable' },
};

export const planetSymbols = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  'North Node': '☊',
  'South Node': '☋',
};

// ── Convenience maps used by chart screen ──

/** Sign name → unicode glyph */
export const ZODIAC_SYMBOLS: Record<string, string> = Object.fromEntries(
  Object.entries(zodiacSigns).map(([name, { symbol }]) => [name, symbol]),
);

/** Planet name → unicode glyph */
export const PLANET_SYMBOLS: Record<string, string> = { ...planetSymbols };

/** Sign name → element */
export const ELEMENTS: Record<string, string> = Object.fromEntries(
  Object.entries(zodiacSigns).map(([name, { element }]) => [
    name,
    element.charAt(0).toUpperCase() + element.slice(1),
  ]),
);

/** Sign name → quality */
export const QUALITIES: Record<string, string> = Object.fromEntries(
  Object.entries(zodiacSigns).map(([name, { quality }]) => [
    name,
    quality.charAt(0).toUpperCase() + quality.slice(1),
  ]),
);
