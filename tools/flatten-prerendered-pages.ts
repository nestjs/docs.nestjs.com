/**
 * Runs after `ng build`, which prerenders every chapter to
 * `dist/<route>/index.html` (see `src/app/app.routes.server.ts`).
 *
 * Netlify answers a request for a folder that holds an `index.html` with a 301
 * to its trailing-slash URL (`/v10` -> `/v10/`), so every chapter would move
 * away from its canonical URL, the sitemap and the links between chapters. It
 * serves `<route>.html` at `/<route>` instead, so each page is moved there:
 * `dist/observability/opentelemetry/index.html` becomes
 * `dist/observability/opentelemetry.html`, next to its markdown twin.
 */
import { existsSync, readFileSync, renameSync, rmdirSync } from 'fs';
import { join, resolve } from 'path';

const DIST = resolve(__dirname, '..', 'dist');
/** Written by the Angular build: every route it prerendered. */
const MANIFEST = join(DIST, 'prerendered-routes.json');

const { routes } = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
  routes: Record<string, unknown>;
};
// Deepest first, so a folder is empty by the time its own page moves out.
const paths = Object.keys(routes)
  .filter((route) => route !== '/')
  .sort((a, b) => b.split('/').length - a.split('/').length);

for (const route of paths) {
  const folder = join(DIST, route);
  const page = join(folder, 'index.html');
  if (!existsSync(page)) {
    throw new Error(`${route} is in ${MANIFEST}, but ${page} does not exist`);
  }
  renameSync(page, `${folder}.html`);
  try {
    rmdirSync(folder);
  } catch {
    // Not empty: it holds the pages nested under this one.
  }
}

console.log(`Moved ${paths.length} prerendered pages to <route>.html.`);
