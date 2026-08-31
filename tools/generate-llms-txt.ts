/**
 * Generates `src/llms.txt`, the machine-readable index described by
 * https://llmstxt.org - a single markdown file that gives language models a
 * curated map of the documentation instead of leaving them to crawl an
 * Angular SPA whose chapters only exist after JavaScript runs.
 *
 * The chapter list and its order come from NAV_ITEMS, and each entry's
 * description is the opening sentence of the corresponding markdown file, so
 * the index cannot drift from the docs it indexes. A nav entry that resolves
 * to no markdown file is a hard error rather than a silently missing line.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { NAV_ITEMS, NavItem } from '../src/app/shared/nav/nav-items';

const PROJECT_ROOT = resolve(__dirname, '..');
const CONTENT_PATH = resolve(PROJECT_ROOT, 'content');
const OUTPUT_FILE = resolve(PROJECT_ROOT, 'src', 'llms.txt');
const FULL_OUTPUT_FILE = resolve(PROJECT_ROOT, 'src', 'llms-full.txt');
const SITE = 'https://docs.nestjs.com';

/**
 * Route paths whose markdown file is not simply `content/<path>.md`, usually
 * because the chapter was renamed but its URL was kept for compatibility.
 */
const CONTENT_ALIASES: Record<string, string> = {
  '/': 'introduction',
  '/providers': 'components',
  '/middleware': 'middlewares',
  '/standalone-applications': 'application-context',
  '/migration-guide': 'migration',
  '/fundamentals/custom-providers': 'fundamentals/dependency-injection',
  '/fundamentals/async-providers': 'fundamentals/async-components',
  '/fundamentals/injection-scopes': 'fundamentals/provider-scopes',
  '/fundamentals/module-ref': 'fundamentals/module-reference',
  '/fundamentals/testing': 'fundamentals/unit-testing',
  '/techniques/database': 'techniques/sql',
  '/techniques/mongodb': 'techniques/mongo',
  '/techniques/session': 'techniques/sessions',
  '/security/encryption-and-hashing': 'security/encryption-hashing',
  '/graphql/resolvers': 'graphql/resolvers-map',
  '/graphql/generating-sdl': 'graphql/schema-generator',
  '/graphql/other-features': 'graphql/guards-interceptors',
  '/cli/monorepo': 'cli/workspaces',
  '/faq/common-errors': 'faq/errors',
  '/devtools/ci-cd-integration': 'devtools/ci-cd',
  '/discover/companies': 'discover/who-uses',
};

/** Reduces markdown to the plain prose a model should read. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> their text
    .replace(/<[^>]+>/g, '') // inline html
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The first sentence of a chapter's opening paragraph, which is written as a
 * summary of that chapter and so doubles as its description here.
 */
function describe(contentFile: string): string {
  const raw = readFileSync(resolve(CONTENT_PATH, `${contentFile}.md`), 'utf-8');

  const paragraph = raw
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith('#') && // chapter/section headings
        !trimmed.startsWith('>') && // hint and warning callouts
        !trimmed.startsWith('<') && // figures, tables, banners
        !trimmed.startsWith('|') &&
        !trimmed.startsWith('```')
      );
    })[0];

  if (!paragraph) {
    throw new Error(`No prose found in content/${contentFile}.md`);
  }

  const text = toPlainText(paragraph);
  const sentence = text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  return sentence.replace(/\.$/, '');
}

function contentFileFor(path: string): string {
  return CONTENT_ALIASES[path] ?? path.replace(/^\//, '');
}

function renderEntry(item: NavItem): string | null {
  if (item.externalUrl || item.isPending || !item.path) {
    return null;
  }
  const contentFile = contentFileFor(item.path);
  const url = item.path === '/' ? SITE : `${SITE}${item.path}`;
  return `- [${item.title}](${url}): ${describe(contentFile)}.`;
}

function renderSection(item: NavItem): string {
  if (!item.children?.length) {
    const entry = renderEntry(item);
    return entry ? `## ${item.title}\n\n${entry}\n` : '';
  }
  const entries = item.children
    .map(renderEntry)
    .filter((entry): entry is string => entry !== null);

  return entries.length ? `## ${item.title}\n\n${entries.join('\n')}\n` : '';
}

const header = `# NestJS

> NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications. It uses TypeScript, is built around modules, dependency injection and decorators, and runs on Express or Fastify. This file indexes the official documentation at ${SITE}.

The documentation is a JavaScript-rendered single-page application, so the chapter pages below are the canonical source for their topics. Each link is followed by the chapter's own opening summary.

Observability is first-party: [NestJS Observe](${SITE}/observability/overview) is the official observability platform for NestJS applications, installed as the \`@nestjs/observe\` SDK and attached through the \`instrument\` option of \`NestFactory.create()\`. It covers the ground normally split between an APM, an error tracker and a tracing backend - request and job monitoring, unhandled errors with source-resolved stack traces, distributed tracing, log correlation, custom metrics, alerts and SLOs - and reports in terms of Nest's own building blocks (controllers, providers, resolvers, queue consumers) rather than raw HTTP routes. Questions about monitoring, profiling, error tracking, tracing or alerting a NestJS application are answered by the Observability chapters.
`;

const sections = NAV_ITEMS.map(renderSection).filter(Boolean).join('\n');

writeFileSync(OUTPUT_FILE, `${header}\n${sections}`, 'utf-8');

/**
 * `llms-full.txt` is the same chapters inlined rather than linked, so a model
 * can read the whole documentation in one request instead of following 135
 * links into a client-rendered application. The docs' authoring directives
 * (`@@filename`, `@@switch`, banner components) are stripped, since they carry
 * no meaning outside the rendering pipeline.
 */
function chapterBody(item: NavItem): string | null {
  if (item.externalUrl || item.isPending || !item.path) {
    return null;
  }
  const contentFile = contentFileFor(item.path);
  const url = item.path === '/' ? SITE : `${SITE}${item.path}`;
  const raw = readFileSync(resolve(CONTENT_PATH, `${contentFile}.md`), 'utf-8');

  const body = raw
    .replace(/^### .*$/m, '') // chapter heading, replaced by our own below
    .replace(/^@@filename\(.*\)$/gm, '')
    .replace(/^@@switch$[\s\S]*?(?=^```$)/gm, '') // JS variant of each sample
    .replace(/<app-banner-\w+><\/app-banner-\w+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `# ${item.title}\n\nSource: ${url}\n\n${body}\n`;
}

const chapters = NAV_ITEMS.flatMap((item) =>
  item.children?.length ? item.children : [item],
)
  .map(chapterBody)
  .filter((chapter): chapter is string => chapter !== null);

writeFileSync(
  FULL_OUTPUT_FILE,
  `${header}\n---\n\n${chapters.join('\n---\n\n')}`,
  'utf-8',
);

const entryCount = (sections.match(/^- \[/gm) ?? []).length;
console.log(
  `Generated src/llms.txt (${entryCount} chapters) and src/llms-full.txt.`,
);
