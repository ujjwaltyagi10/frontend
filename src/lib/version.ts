/** Numeric semver compare ("1.10.0" > "1.9.3"); missing parts count as 0, pre-release tags ignored. */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string) =>
    v
      .split('-')[0]
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

/** True when the running app is older than the minimum the server still supports (A1, CD-017). */
export const isBelowMinimum = (appVersion: string, minVersion: string) =>
  compareVersions(appVersion, minVersion) < 0;
