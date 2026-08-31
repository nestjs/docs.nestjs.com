import { describe, expect, it } from 'vitest';
import { Route, Routes } from '@angular/router';
import { routes } from '../../app.routes';
import { NAV_ITEMS } from './nav-items';
import { flattenNavItems } from './nav-sequence';

interface ResolvedRoute {
  path: string;
  isRedirect: boolean;
}

/**
 * Walks the route table, following `loadChildren` so lazy chapters are covered
 * too, and returns every reachable URL with whether it only redirects.
 */
async function resolveRoutes(
  config: Routes,
  prefix = '',
): Promise<ResolvedRoute[]> {
  const resolved: ResolvedRoute[] = [];

  for (const route of config as Route[]) {
    if (route.path === undefined || route.path === '**') {
      continue;
    }
    const path = [prefix, route.path].filter(Boolean).join('/');
    const url = `/${path}`;

    if (route.redirectTo !== undefined) {
      resolved.push({ path: url, isRedirect: true });
      continue;
    }
    if (route.component) {
      resolved.push({ path: url === '/' ? '/' : url, isRedirect: false });
    }
    if (route.children) {
      resolved.push(...(await resolveRoutes(route.children, path)));
    }
    if (route.loadChildren) {
      const lazy = await (route.loadChildren as () => Promise<Routes>)();
      resolved.push(...(await resolveRoutes(lazy, path)));
    }
  }

  return resolved;
}

describe('NAV_ITEMS against the route table', () => {
  it('points every page in the reading order at a real, non-redirecting route', async () => {
    const resolved = await resolveRoutes(routes);
    const byPath = new Map(resolved.map((r) => [r.path, r]));

    const missing: string[] = [];
    const redirects: string[] = [];

    for (const page of flattenNavItems(NAV_ITEMS)) {
      const match = byPath.get(page.path);
      if (!match) {
        missing.push(`${page.title} -> ${page.path}`);
      } else if (match.isRedirect) {
        // A redirect alias in the sidebar is merely a shortcut, but the pager
        // walks readers through it in sequence and lands them in another
        // chapter with no way back.
        redirects.push(`${page.title} -> ${page.path}`);
      }
    }

    expect(missing).toEqual([]);
    expect(redirects).toEqual([]);
  });
});
