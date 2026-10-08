import { ensureJsonString, validateJsonString } from '../../src/utils/json.js';

describe('ensureJsonString', () => {
  const sut = ensureJsonString;

  it('returns a string value unchanged', () => {
    expect(sut('{"key":"value"}')).toBe('{"key":"value"}');
  });

  it('stringifies an object', () => {
    expect(sut({ key: 'value' })).toBe('{"key":"value"}');
  });

  it('stringifies an array', () => {
    expect(sut([1, 2])).toBe('[1,2]');
  });

  it('stringifies null', () => {
    expect(sut(null)).toBe('null');
  });
});

describe('validateJsonString', () => {
  const sut = validateJsonString;

  it('returns valid JSON unchanged', () => {
    expect(sut('{"key":"value"}')).toBe('{"key":"value"}');
  });

  it('accepts a JSON array', () => {
    expect(sut('[1,2,3]')).toBe('[1,2,3]');
  });

  it('throws on invalid JSON', () => {
    expect(() => sut('not json')).toThrow('Invalid JSON: not json');
  });

  it('includes label in error when provided', () => {
    expect(() => sut('bad', '--config')).toThrow('Invalid JSON for --config: bad');
  });
});
