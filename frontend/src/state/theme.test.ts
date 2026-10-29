import { describe, expect, it } from 'vitest';
import { nextThemePref, parseThemePref, resolveTheme } from './theme';

describe('parseThemePref', () => {
  it('accepts the three valid values', () => {
    expect(parseThemePref('system')).toBe('system');
    expect(parseThemePref('light')).toBe('light');
    expect(parseThemePref('dark')).toBe('dark');
  });

  it('falls back to system for missing or invalid values', () => {
    expect(parseThemePref(null)).toBe('system');
    expect(parseThemePref('purple')).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('follows the OS in system mode', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('ignores the OS when a theme is chosen', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('nextThemePref', () => {
  it('cycles system, light, dark', () => {
    expect(nextThemePref('system')).toBe('light');
    expect(nextThemePref('light')).toBe('dark');
    expect(nextThemePref('dark')).toBe('system');
  });
});
