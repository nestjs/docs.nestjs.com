import { RenderMode, ServerRoute } from '@angular/ssr';
import { NAV_ITEMS } from './shared/nav/nav-items';
import { flattenNavItems } from './shared/nav/nav-sequence';

/**
 * Every chapter in the sidebar - the same list sitemap.xml is generated from -
 * is prerendered at build time, so crawlers and readers without JavaScript get
 * the whole page. Everything else stays client-side, as before: routes that
 * only redirect (a static redirect page would drop the fragment `movedTo()`
 * carries over), category roots with no chapter of their own, unknown URLs.
 */
export const serverRoutes: ServerRoute[] = [
  ...flattenNavItems(NAV_ITEMS).map(
    ({ path }): ServerRoute => ({
      path: path.replace(/^\//, ''),
      renderMode: RenderMode.Prerender,
    }),
  ),
  { path: '**', renderMode: RenderMode.Client },
];
