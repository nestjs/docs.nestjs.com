/**
 * Shallow-clones (or updates) every repository in `packages.ts` into
 * `sources/`, which the API compiler reads. Run with `npm run api:fetch`.
 *
 * Runs on Node's built-in type stripping, so no ts-node: keep it to erasable
 * syntax and import local files with their `.ts` extension.
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { REPOSITORIES, type SourceRepository } from './packages.ts';

const SOURCES_PATH = resolve(import.meta.dirname, '../../sources');
const CONCURRENCY = 8;

const run = promisify(execFile);

// ponytail: unpinned, so a broken commit on a package's default branch breaks
// the docs build; set `ref` on that repository in packages.ts to pin it.
async function sync({ name, ref }: SourceRepository): Promise<void> {
  const dir = resolve(SOURCES_PATH, name);
  if (existsSync(resolve(dir, '.git'))) {
    await run('git', ['-C', dir, 'fetch', '--depth', '1', 'origin', ref ?? 'HEAD']);
    await run('git', ['-C', dir, 'reset', '--hard', 'FETCH_HEAD']);
  } else {
    const branch = ref ? ['--branch', ref] : [];
    const url = `https://github.com/nestjs/${name}.git`;
    await run('git', ['clone', '--depth', '1', ...branch, url, dir]);
  }
  console.log(`  ${name}`);
}

mkdirSync(SOURCES_PATH, { recursive: true });
console.log(`Fetching ${REPOSITORIES.length} repositories into sources/`);

const queue = [...REPOSITORIES];
const failures: string[] = [];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let repo = queue.shift(); repo; repo = queue.shift()) {
      await sync(repo).catch((error: Error) =>
        failures.push(`${repo.name}: ${error.message.trim()}`),
      );
    }
  }),
);

// A renamed or moved entry point would otherwise only surface as a package
// silently missing from the reference.
const missing = REPOSITORIES.flatMap(({ name, entries }) =>
  entries
    .map(({ entry }) => `${name}/${entry}`)
    .filter((path) => !existsSync(resolve(SOURCES_PATH, path))),
);
failures.push(...missing.map((path) => `entry point not found: ${path}`));

if (failures.length) {
  console.error(`\n${failures.join('\n')}`);
  process.exit(1);
}
