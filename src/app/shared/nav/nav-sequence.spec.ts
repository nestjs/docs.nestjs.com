import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, NavItem } from './nav-items';
import { findAdjacentPages, flattenNavItems } from './nav-sequence';

const items: NavItem[] = [
  { title: 'Introduction', path: '/' },
  {
    title: 'Group A',
    children: [
      { title: 'A one', path: '/a/one' },
      { title: 'A two', path: '/a/two' },
    ],
  },
  {
    title: 'Group B',
    children: [
      { title: 'B one', path: '/b/one' },
      { title: 'External', externalUrl: 'https://example.com' },
    ],
  },
  { title: 'Last', path: '/last' },
];

describe('flattenNavItems', () => {
  it('walks the tree depth-first and keeps only navigable pages', () => {
    expect(flattenNavItems(items)).toEqual([
      { title: 'Introduction', path: '/' },
      { title: 'A one', path: '/a/one', section: 'Group A' },
      { title: 'A two', path: '/a/two', section: 'Group A' },
      { title: 'B one', path: '/b/one', section: 'Group B' },
      { title: 'Last', path: '/last' },
    ]);
  });

  it('drops entries that only link somewhere external', () => {
    expect(flattenNavItems(items).map((page) => page.title)).not.toContain(
      'External',
    );
  });

  it('drops group headers that have no page of their own', () => {
    expect(flattenNavItems(items).map((page) => page.title)).not.toContain(
      'Group A',
    );
  });

  it('keeps group headers that are navigable in their own right', () => {
    const withNavigableHeader: NavItem[] = [
      {
        title: 'Header',
        path: '/header',
        children: [{ title: 'Child', path: '/header/child' }],
      },
    ];

    expect(flattenNavItems(withNavigableHeader)).toEqual([
      { title: 'Header', path: '/header' },
      { title: 'Child', path: '/header/child', section: 'Header' },
    ]);
  });
});

describe('findAdjacentPages', () => {
  it('returns both neighbours for a page in the middle of the sequence', () => {
    expect(findAdjacentPages(items, '/a/two')).toEqual({
      prev: { title: 'A one', path: '/a/one', section: 'Group A' },
      next: { title: 'B one', path: '/b/one', section: 'Group B' },
    });
  });

  it('links the last page of a group to the first page of the next group', () => {
    expect(findAdjacentPages(items, '/a/two').next).toEqual({
      title: 'B one',
      path: '/b/one',
      section: 'Group B',
    });
  });

  it('has no previous page on the first page', () => {
    expect(findAdjacentPages(items, '/')).toEqual({
      prev: null,
      next: { title: 'A one', path: '/a/one', section: 'Group A' },
    });
  });

  it('has no next page on the last page', () => {
    expect(findAdjacentPages(items, '/last')).toEqual({
      prev: { title: 'B one', path: '/b/one', section: 'Group B' },
      next: null,
    });
  });

  it('returns nothing for a page that is not part of the sequence', () => {
    expect(findAdjacentPages(items, '/enterprise')).toEqual({
      prev: null,
      next: null,
    });
  });

  it.each(['/a/two/', '/a/two?version=11', '/a/two#anchor', '/a/two/?x=1#y'])(
    'normalizes %s before looking it up',
    (url) => {
      expect(findAdjacentPages(items, url).next).toEqual({
        title: 'B one',
        path: '/b/one',
        section: 'Group B',
      });
    },
  );

  it('resolves the root path even with a trailing slash', () => {
    expect(findAdjacentPages(items, '/').prev).toBeNull();
  });

  it('strips matrix parameters before looking the URL up', () => {
    expect(findAdjacentPages(items, '/a/two;v=11').next).toEqual({
      title: 'B one',
      path: '/b/one',
      section: 'Group B',
    });
  });

  it('carries the section down through nesting deeper than one level', () => {
    const deep: NavItem[] = [
      {
        title: 'Outer',
        children: [
          {
            title: 'Inner',
            children: [{ title: 'Leaf', path: '/outer/inner/leaf' }],
          },
        ],
      },
    ];

    expect(flattenNavItems(deep)).toEqual([
      { title: 'Leaf', path: '/outer/inner/leaf', section: 'Inner' },
    ]);
  });
});

describe('the real navigation tree', () => {
  const pages = flattenNavItems(NAV_ITEMS);

  it('starts at the introduction and ends at the support page', () => {
    expect(pages[0].path).toBe('/');
    expect(pages[pages.length - 1].path).toBe('/support');
  });

  it('does not list the same page twice', () => {
    const paths = pages.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('carries the reader across a group boundary', () => {
    expect(findAdjacentPages(NAV_ITEMS, '/cli/scripts').next).toEqual({
      title: 'Introduction',
      path: '/openapi/introduction',
      section: 'OpenAPI',
    });
  });

  it('offers a next page on the short CLI overview page from the issue', () => {
    expect(findAdjacentPages(NAV_ITEMS, '/cli/overview').next).toEqual({
      title: 'Workspaces',
      path: '/cli/monorepo',
      section: 'CLI',
    });
  });

  it('gives every page a title to render in the link', () => {
    expect(pages.every((page) => page.title.length > 0)).toBe(true);
  });

  it('names the chapter for every page that lives inside one', () => {
    // Only the handful of standalone top-level pages may go without.
    const sectionless = pages
      .filter((page) => !page.section)
      .map((page) => page.path);

    expect(sectionless).toEqual([
      '/',
      '/deployment',
      '/standalone-applications',
      '/migration-guide',
      '/support',
    ]);
  });

  it('disambiguates pages that share a title', () => {
    const overviews = pages.filter((page) => page.title === 'Overview');

    expect(overviews.length).toBeGreaterThan(1);
    expect(new Set(overviews.map((page) => page.section)).size).toBe(
      overviews.length,
    );
  });
});
