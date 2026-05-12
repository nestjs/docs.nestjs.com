import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { executeVfsCommand } from './vfs-executor.mjs';

async function createFixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'nestjs-docs-vfs-'));
  const contentDir = join(rootDir, 'content');

  await mkdir(join(contentDir, 'recipes'), { recursive: true });
  await writeFile(join(contentDir, 'recipes', 'passport.md'), 'AuthGuard\nJwtStrategy\npassport-jwt\n');

  return contentDir;
}

describe('NestJS docs VFS executor', () => {
  it('returns structured output for allowed commands', async () => {
    const contentDir = await createFixture();

    await expect(
      executeVfsCommand('rg -n "AuthGuard|JwtStrategy|passport-jwt" recipes | head -20', contentDir),
    ).resolves.toMatchObject({
      exit: 0,
      stderr: '',
    });
  });

  it('preserves pipe characters inside quoted regexes', async () => {
    const contentDir = await createFixture();

    const result = await executeVfsCommand(
      'rg -n "AuthGuard|JwtStrategy|passport-jwt" recipes | head -20',
      contentDir,
    );

    expect(result.stdout).toContain('recipes/passport.md:1:AuthGuard');
  });
});
