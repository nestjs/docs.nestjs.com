import { describe, expect, it } from 'vitest';
import {
  PACKAGE_GROUPS,
  PACKAGES,
  REPOSITORIES,
} from '../../../../../tools/api/packages';

describe('tools/api/packages.ts', () => {
  it('lists every repository once', () => {
    const names = REPOSITORIES.map((repo) => repo.name);
    expect(names.length).toBe(new Set(names).size);
  });

  it('lists every entry point once', () => {
    const paths = PACKAGES.map((pkg) => pkg.path);
    expect(paths.length).toBe(new Set(paths).size);
  });

  it('gives every repository an entry point in a known group', () => {
    for (const repo of REPOSITORIES) {
      expect(repo.entries.length, repo.name).toBeGreaterThan(0);
      for (const { entry, group } of repo.entries) {
        expect(PACKAGE_GROUPS, `${repo.name}/${entry}`).toContain(group);
        expect(entry, `${repo.name}/${entry}`).toMatch(/^[\w./-]+\/index\.ts$/);
      }
    }
  });
});
