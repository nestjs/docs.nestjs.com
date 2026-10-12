/**
 * Code spans that match an export but mean something else on the page that
 * uses them, e.g. the cookie `Path` attribute vs. `@nestjs/observe`'s `Path`.
 */
const EXCLUDED_NAMES = new Set(['Path']);

/** When the page does not settle a tie, the core packages win. */
const PREFERRED_PACKAGES = ['common', 'core'];

interface ApiExport {
  path: string;
  package: string;
}

/** Export name -> every export of that name. */
export type ApiIndex = Map<string, ApiExport[]>;

/** The shape of `api-list.json`, written by the API reference compiler. */
export interface ApiListSection {
  title: string;
  items: { title: string; path: string }[] | null;
}

export function buildApiIndex(sections: ApiListSection[]): ApiIndex {
  const index: ApiIndex = new Map();
  for (const section of sections) {
    for (const item of section.items ?? []) {
      const exports = index.get(item.title) ?? [];
      exports.push({ path: item.path, package: section.title });
      index.set(item.title, exports);
    }
  }
  return index;
}

function countMentions(page: string, pkg: string): number {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.match(new RegExp(`@nestjs/${escaped}(?![\\w.-])`, 'g'))?.length ?? 0;
}

/**
 * The API reference path for a code span such as `ValidationPipe`,
 * `@Injectable()` or `registerAs()`, or `null` when it names no export.
 *
 * An export name shared by several packages (`BullModule` in bull and bullmq)
 * resolves to the package the page mentions most as `@nestjs/<package>`, and
 * stays unlinked when the page does not settle it.
 */
export function resolveApiLink(
  code: string,
  page: string,
  index: ApiIndex,
): string | null {
  const match = /^@?([A-Za-z_$][\w$]*)(\(\))?$/.exec(code);
  const exports = match && index.get(match[1]);
  if (!exports || EXCLUDED_NAMES.has(match[1])) {
    return null;
  }
  // Functions and constants are lowercase words (`html`, `github`) that often
  // mean something else; only a call such as `github()` names the export.
  if (/^[a-z]/.test(match[1]) && !match[2]) {
    return null;
  }
  if (exports.length === 1) {
    return exports[0].path;
  }
  const mentions = exports.map((e) => countMentions(page, e.package));
  const most = Math.max(...mentions);
  if (most > 0 && mentions.filter((m) => m === most).length === 1) {
    return exports[mentions.indexOf(most)].path;
  }
  const preferred = exports.filter((e) => PREFERRED_PACKAGES.includes(e.package));
  return preferred.length === 1 ? preferred[0].path : null;
}
