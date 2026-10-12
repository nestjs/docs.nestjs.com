import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Renderer, Tokens } from 'marked';
import { SRC_PATH } from '../../../config';
import { ApiIndex, buildApiIndex, resolveApiLink } from '../api-links';

/** Written by the API reference compiler (`npm run api:compile`). */
const API_LIST_PATH = resolve(SRC_PATH, 'generated/api/api-list.json');

/** Without a compiled reference (no `npm run api` yet) nothing is linked. */
function loadApiIndex(): ApiIndex {
  return existsSync(API_LIST_PATH)
    ? buildApiIndex(JSON.parse(readFileSync(API_LIST_PATH, 'utf-8')))
    : new Map();
}

/**
 * Links code spans that name an export, such as `MongooseHealthIndicator`,
 * to its API reference page. Code inside a link or a heading is left alone,
 * since an anchor cannot nest in another one.
 *
 * The link is a `[routerLink]` binding rather than the plain attribute other
 * links use, so a page component that does not import RouterLink fails to
 * compile instead of rendering a dead link.
 *
 * Must be applied after the other renderers, so it wraps their final link and
 * heading methods.
 */
export function applyApiLinkRenderer(
  renderer: Renderer,
  getPage: () => string,
) {
  let index: ApiIndex | undefined;
  let unlinkable = 0;
  const suppressIn = (method: 'link' | 'heading') => {
    const original = renderer[method] as (...args: unknown[]) => string;
    renderer[method] = function (...args: unknown[]) {
      unlinkable++;
      try {
        return original.apply(this, args);
      } finally {
        unlinkable--;
      }
    };
  };
  suppressIn('link');
  suppressIn('heading');

  const originalCodeSpan = renderer.codespan;
  renderer.codespan = function (token: Tokens.Codespan) {
    const html = originalCodeSpan.call(this, token) as string;
    index ??= loadApiIndex();
    const path = unlinkable ? null : resolveApiLink(token.text, getPage(), index);
    return path ? `<a [routerLink]="'${path}'">${html}</a>` : html;
  };
}
