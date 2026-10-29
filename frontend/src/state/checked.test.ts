import { describe, expect, it } from 'vitest';
import {
  countPacked,
  parseChecked,
  progressPercent,
  serializeChecked,
  toggleChecked,
} from './checked';

describe('parseChecked', () => {
  it('reads a stored id list', () => {
    expect(parseChecked('["diapers","sun-hat"]')).toEqual(new Set(['diapers', 'sun-hat']));
  });

  it('treats missing or corrupt storage as nothing checked', () => {
    expect(parseChecked(null)).toEqual(new Set());
    expect(parseChecked('not json')).toEqual(new Set());
    expect(parseChecked('{"a":1}')).toEqual(new Set());
  });

  it('drops entries that are not strings', () => {
    expect(parseChecked('["diapers",1,null,{}]')).toEqual(new Set(['diapers']));
  });

  it('round-trips through serializeChecked', () => {
    const checked = new Set(['pacifier', 'rain-gear']);
    expect(parseChecked(serializeChecked(checked))).toEqual(checked);
  });
});

describe('toggleChecked', () => {
  it('adds and removes without mutating the input', () => {
    const original = new Set(['diapers']);
    const added = toggleChecked(original, 'pacifier');
    expect(added).toEqual(new Set(['diapers', 'pacifier']));
    expect(original).toEqual(new Set(['diapers']));
    expect(toggleChecked(added, 'diapers')).toEqual(new Set(['pacifier']));
  });
});

describe('progress', () => {
  it('counts only ids that are in the current list', () => {
    expect(countPacked(['diapers', 'pacifier'], new Set(['diapers', 'removed-item']))).toBe(1);
  });

  it('rounds the percentage and handles an empty list', () => {
    expect(progressPercent(2, 7)).toBe(29);
    expect(progressPercent(7, 7)).toBe(100);
    expect(progressPercent(0, 7)).toBe(0);
    expect(progressPercent(0, 0)).toBe(0);
  });
});
