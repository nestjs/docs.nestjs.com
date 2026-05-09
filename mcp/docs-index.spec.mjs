import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  createDocsIndex,
  listMarkdownFiles,
  readDocFile,
  searchDocs,
} from './docs-index.mjs';

async function createFixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'nestjs-docs-mcp-'));
  const contentDir = join(rootDir, 'content');

  await mkdir(join(contentDir, 'fundamentals'), { recursive: true });
  await writeFile(
    join(contentDir, 'controllers.md'),
    '# Controllers\n\nControllers route incoming requests.',
  );
  await writeFile(
    join(contentDir, 'fundamentals', 'dependency-injection.md'),
    '# Dependency Injection\n\nProviders can be injected into controllers.',
  );
  await writeFile(join(rootDir, 'README.md'), '# Not indexed');

  return createDocsIndex({ rootDir, contentDir });
}

describe('NestJS docs MCP index', () => {
  it('lists markdown files under content with relative paths', async () => {
    const index = await createFixture();

    await expect(listMarkdownFiles(index)).resolves.toEqual([
      'content/controllers.md',
      'content/fundamentals/dependency-injection.md',
    ]);
  });

  it('searches documentation case-insensitively', async () => {
    const index = await createFixture();

    await expect(searchDocs(index, 'PROVIDERS')).resolves.toEqual([
      expect.objectContaining({
        path: 'content/fundamentals/dependency-injection.md',
        title: 'Dependency Injection',
      }),
    ]);
  });

  it('reads only markdown files from content', async () => {
    const index = await createFixture();

    await expect(readDocFile(index, 'content/controllers.md')).resolves.toContain(
      'Controllers route incoming requests.',
    );
    await expect(readDocFile(index, 'README.md')).rejects.toThrow(
      'Only content markdown files can be read',
    );
  });
});
