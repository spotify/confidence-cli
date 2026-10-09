import { capitalize, conjoin } from '../../src/utils/strings.js';

describe('capitalize', () => {
  const sut = capitalize;

  it('uppercases the first character', () => {
    expect(sut('hello')).toBe('Hello');
  });

  it('leaves an already-capitalized string unchanged', () => {
    expect(sut('Hello')).toBe('Hello');
  });

  it('handles a single character', () => {
    expect(sut('a')).toBe('A');
  });

  it('handles an empty string', () => {
    expect(sut('')).toBe('');
  });
});

describe('conjoin', () => {
  const sut = conjoin;

  it('returns an empty string for an empty list', () => {
    expect(sut([])).toBe('');
  });

  it('returns the single item for a one-element list', () => {
    expect(sut(['apples'])).toBe('apples');
  });

  it('joins two items with "and"', () => {
    expect(sut(['apples', 'oranges'])).toBe('apples and oranges');
  });

  it('joins three items with an Oxford comma', () => {
    expect(sut(['apples', 'oranges', 'bananas'])).toBe('apples, oranges, and bananas');
  });

  it('joins four items with an Oxford comma', () => {
    expect(sut(['a', 'b', 'c', 'd'])).toBe('a, b, c, and d');
  });

  it('accepts a custom conjunction', () => {
    expect(sut(['apples', 'oranges', 'bananas'], 'or')).toBe('apples, oranges, or bananas');
  });

  it('uses custom conjunction for two items', () => {
    expect(sut(['apples', 'oranges'], 'or')).toBe('apples or oranges');
  });
});
