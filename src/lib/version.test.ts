import { compareVersions, isBelowMinimum } from './version';

describe('compareVersions', () => {
  it('compares numerically, not as text', () => {
    expect(compareVersions('1.10.0', '1.9.3')).toBe(1);
    expect(compareVersions('1.9.3', '1.10.0')).toBe(-1);
  });
  it('treats missing parts as zero', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('2', '1.99.99')).toBe(1);
  });
  it('ignores pre-release tags', () => expect(compareVersions('1.2.0-beta.1', '1.2.0')).toBe(0));
});

describe('isBelowMinimum', () => {
  it('forces an update only for older apps', () => {
    expect(isBelowMinimum('1.0.0', '1.0.1')).toBe(true);
    expect(isBelowMinimum('1.0.1', '1.0.1')).toBe(false);
    expect(isBelowMinimum('1.2.0', '1.0.1')).toBe(false);
  });
});
