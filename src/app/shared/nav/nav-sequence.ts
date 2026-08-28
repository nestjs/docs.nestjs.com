import { NavItem } from './nav-items';

export interface NavPage {
  title: string;
  path: string;
}

export interface AdjacentPages {
  prev: NavPage | null;
  next: NavPage | null;
}

/**
 * Flattens the sidebar tree into the linear order a reader moves through, so the
 * last page of a chapter leads straight into the first page of the next one.
 * Entries that only point somewhere external are left out - they are references,
 * not the next thing to read.
 */
export function flattenNavItems(items: NavItem[]): NavPage[] {
  const pages: NavPage[] = [];

  const walk = (nodes: NavItem[]): void => {
    for (const node of nodes) {
      if (node.path) {
        pages.push({ title: node.title, path: node.path });
      }
      if (node.children) {
        walk(node.children);
      }
    }
  };
  walk(items);

  return pages;
}

/**
 * Strips the query string, the fragment and any trailing slash, so that the URL
 * the router hands us lines up with the plain paths listed in the sidebar.
 */
function normalizeUrl(url: string): string {
  const path = url.split(/[?#]/)[0];
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/**
 * Looks the given URL up in the reading order. A URL that is not part of the
 * sidebar - a redirect alias, or a standalone page such as /enterprise - gets no
 * neighbours rather than a guess.
 */
export function findAdjacentPages(
  items: NavItem[],
  url: string,
): AdjacentPages {
  const pages = flattenNavItems(items);
  const path = normalizeUrl(url);
  const index = pages.findIndex((page) => page.path === path);

  if (index < 0) {
    return { prev: null, next: null };
  }
  return {
    prev: pages[index - 1] ?? null,
    next: pages[index + 1] ?? null,
  };
}
