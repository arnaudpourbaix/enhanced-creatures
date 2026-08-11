export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(value: string): SemVer {
  const match = SEMVER_PATTERN.exec(value);
  if (!match) {
    throw new Error(`"${value}" is not a valid version (expected X.Y.Z)`);
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function isGreater(next: SemVer, current: SemVer): boolean {
  if (next.major !== current.major) return next.major > current.major;
  if (next.minor !== current.minor) return next.minor > current.minor;
  return next.patch > current.patch;
}
