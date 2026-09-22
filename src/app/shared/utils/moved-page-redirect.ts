import { inject } from '@angular/core';
import { RedirectFunction, Router } from '@angular/router';

/**
 * Redirects a page that moved to its new URL. Unlike a string `redirectTo`,
 * it keeps the query parameters and the fragment, so links to a section of the
 * old page still land on that section.
 *
 * @param path the new URL of the page
 * @param defaultFragment the section to open when the old URL has no fragment
 * (e.g., for a chapter that was merged into a section of another page)
 */
export function movedTo(
  path: string,
  defaultFragment?: string,
): RedirectFunction {
  return ({ queryParams, fragment }) =>
    inject(Router).createUrlTree([path], {
      queryParams,
      fragment: fragment ?? defaultFragment,
    });
}

/**
 * Redirects a page that was split into several pages, picking the new page by
 * the fragment of the old URL.
 *
 * @param defaultPath the new URL for the old page without a known fragment
 * @param sections maps an old fragment to its new URL (with a fragment, if any)
 */
export function splitInto(
  defaultPath: string,
  sections: Record<string, string>,
): RedirectFunction {
  return ({ queryParams, fragment }) => {
    const target = (fragment && sections[fragment]) || defaultPath;
    const [path, targetFragment] = target.split('#');
    return inject(Router).createUrlTree([path], {
      queryParams,
      fragment: targetFragment,
    });
  };
}
