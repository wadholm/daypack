import { describe, expect, it } from 'vitest';
import {
  countPacked,
  emptyChecked,
  parseChecked,
  progressPercent,
  serializeChecked,
  toggleChecked,
  uncheck,
} from './checked';

describe('parseChecked', () => {
  it('reads ticks per destination', () => {
    const state = parseChecked('{"daycare":["diapers"],"grandparents":["sun-hat"]}');
    expect(state.daycare).toEqual(new Set(['diapers']));
    expect(state.grandparents).toEqual(new Set(['sun-hat']));
  });

  it('gives the old plain id list to the daycare', () => {
    const state = parseChecked('["diapers","sun-hat"]');
    expect(state.daycare).toEqual(new Set(['diapers', 'sun-hat']));
    expect(state.grandparents).toEqual(new Set());
  });

  it('treats missing or corrupt storage as nothing checked', () => {
    expect(parseChecked(null)).toEqual(emptyChecked());
    expect(parseChecked('not json')).toEqual(emptyChecked());
    expect(parseChecked('5')).toEqual(emptyChecked());
    expect(parseChecked('{"daycare":"x"}')).toEqual(emptyChecked());
  });

  it('drops entries that are not strings', () => {
    expect(parseChecked('{"daycare":["diapers",1,null,{}]}').daycare).toEqual(new Set(['diapers']));
  });

  it('round-trips through serializeChecked', () => {
    const checked = { daycare: new Set(['pacifier']), grandparents: new Set(['rain-gear']), as: new Set(['towel']) };
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

describe('uncheck', () => {
  it('removes one id without mutating the input', () => {
    const original = new Set(['diapers', 'towel']);
    expect(uncheck(original, 'towel')).toEqual(new Set(['diapers']));
    expect(original.has('towel')).toBe(true);
  });
});
