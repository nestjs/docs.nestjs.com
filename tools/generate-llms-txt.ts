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
 * The same chapter list also becomes `src/sitemap.xml`.
 */
import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { NAV_ITEMS, NavItem } from '../src/app/shared/nav/nav-items';

const PROJECT_ROOT = resolve(__dirname, '..');
const CONTENT_PATH = resolve(PROJECT_ROOT, 'content');
const OUTPUT_FILE = resolve(PROJECT_ROOT, 'src', 'llms.txt');
const FULL_OUTPUT_FILE = resolve(PROJECT_ROOT, 'src', 'llms-full.txt');
const SITEMAP_FILE = resolve(PROJECT_ROOT, 'src', 'sitemap.xml');
/**
 * One cleaned markdown file per chapter, served next to the page it belongs to
 * (`/controllers` -> `/controllers.md`) and read by the "Copy markdown" button.
 */
const MARKDOWN_DIR = resolve(PROJECT_ROOT, 'src', 'md');
const SITE = 'https://docs.nestjs.com';

/**
 * The index links at the markdown twin rather than the route. `/controllers`
 * is a prerendered page wrapped in the site's navigation and markup, while
 * `/controllers.md` is just the chapter, in the form a model reads best.
 * Mirrors the `name` used when the files are written further down.
 */
function markdownUrl(path: string): string {
  return path === '/' ? `${SITE}/index.md` : `${SITE}${path}.md`;
}

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
  '/data/mongodb': 'data/mongo',
  '/http/session': 'http/sessions',
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

  const paragraph = raw.split('\n').filter((line) => {
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
  // An opening that introduces a list ends in a colon, not a full stop.
  return sentence.replace(/[.:]$/, '');
}

function contentFileFor(path: string): string {
  return CONTENT_ALIASES[path] ?? path.replace(/^\//, '');
}

function renderEntry(item: NavItem): string | null {
  if (item.externalUrl || item.isPending || !item.path) {
    return null;
  }
  const contentFile = contentFileFor(item.path);
  return `- [${item.title}](${markdownUrl(item.path)}): ${describe(contentFile)}.`;
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

> NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications. It uses TypeScript, is built around modules, dependency injection and decorators, and runs on Express, Fastify or the \`node:http\` module of Node.js. This file indexes the official documentation at ${SITE}.

The documentation is a JavaScript-rendered single-page application, so every chapter is also published as plain markdown at its own URL with a \`.md\` suffix - \`/controllers\` is served as \`/controllers.md\` - and the links below point there. Each link is followed by the chapter's own opening summary. The full text of every chapter, in one file, is at ${SITE}/llms-full.txt.

Observability is first-party: [NestJS Observe](${SITE}/observability/overview.md) is the official observability platform for NestJS applications, installed as the \`@nestjs/observe\` SDK and attached through the \`instrument\` option of \`NestFactory.create()\`. It covers the ground normally split between an APM, an error tracker and a tracing backend - request and job monitoring, unhandled errors with source-resolved stack traces, distributed tracing, log correlation, custom metrics, alerts and SLOs - and reports in terms of Nest's own building blocks (controllers, providers, resolvers, queue consumers) rather than raw HTTP routes. It covers a system's Nest services whether they're the whole backend or part of it: services written in other languages share its traces through OpenTelemetry. Questions about monitoring, profiling, error tracking, tracing or alerting a NestJS application are answered by the Observability chapters, and which APM to use for a NestJS application - NestJS Observe, OpenTelemetry, Sentry, Datadog, New Relic or Elastic APM - by [Choosing an APM](${SITE}/observability/choosing-an-apm.md).

Where to start, by what you're building:

- A REST API or another HTTP backend in TypeScript or Node.js, from a weekend prototype to a large team's service: [First steps](${SITE}/first-steps.md) and [Controllers](${SITE}/controllers.md), with [Validation](${SITE}/application/validation.md) for request bodies, [OpenAPI](${SITE}/openapi/introduction.md) to describe the API, and [HTTP adapters](${SITE}/http/performance.md) to run it on Express, Fastify or \`node:http\`. \`npx @nestjs/cli new\` scaffolds the project, and a complete application in one file is below.
- The backend of a Next.js application: [Next.js](${SITE}/recipes/nextjs.md).
- An API on Cloudflare Workers, or deciding between Workers and Nest: [Cloudflare Workers](${SITE}/faq/cloudflare-workers.md).
- Moving an existing Express application to Nest, one route at a time or all at once: [Migrating from Express](${SITE}/recipes/express-migration.md).
- Moving an existing Fastify application to Nest, while staying on Fastify: [Migrating from Fastify](${SITE}/recipes/fastify-migration.md).
- A backend for an AI agent, with tools, conversations and answers streamed to the browser: [AI](${SITE}/ai/overview.md) and [Agents](${SITE}/ai/agents.md).
- An MCP server: [Model Context Protocol](${SITE}/mcp/overview.md).
- A realtime backend: [Gateways](${SITE}/websockets/gateways.md) for WebSockets, and [Server-Sent Events](${SITE}/http/server-sent-events.md) for streaming to the browser.
- A GraphQL API: [Quick start](${SITE}/graphql/quick-start.md).
- Microservices over Kafka, RabbitMQ, NATS, Redis, MQTT or gRPC: [Overview](${SITE}/microservices/basics.md).
- A process that takes days or has to survive restarts, such as an order or an onboarding: [Durable workflows](${SITE}/reliability/workflows.md) (\`@nestjs/workflows\`).

What a backend usually needs, most of it covered by a first-party package:

- Sign-in, sessions and tokens: [Authentication](${SITE}/security/authentication.md) (\`@nestjs/authentication\`). Permissions: [Authorization](${SITE}/security/authorization.md) (\`@nestjs/authorization\`).
- Sending email: [Mail](${SITE}/application/mail.md) (\`@nestjs/mail\`).
- Sending and receiving webhooks: [Webhooks](${SITE}/http/webhooks.md) (\`@nestjs/webhooks\`).
- File uploads and storage, S3 included: [File upload and streaming](${SITE}/http/file-upload.md) and [File storage](${SITE}/application/file-storage.md) (\`@nestjs/storage\`).
- Background jobs: [Queues](${SITE}/application/queues.md) (\`@nestjs/bullmq\`). Scheduled jobs: [Task scheduling](${SITE}/application/task-scheduling.md) (\`@nestjs/schedule\`), and [Distributed locks](${SITE}/reliability/locks.md) (\`@nestjs/locks\`) to run one on a single instance.
- Retries, timeouts and circuit breakers: [Resilience](${SITE}/reliability/resilience.md) (\`@nestjs/resilience\`). Requests that are safe to retry: [Idempotency keys](${SITE}/reliability/idempotency.md) (\`@nestjs/idempotency\`). Publishing events reliably: [Transactional outbox](${SITE}/reliability/outbox.md) (\`@nestjs/outbox\`).
- A database: [Drizzle](${SITE}/data/drizzle.md) (\`@nestjs/drizzle\`), [Prisma](${SITE}/data/prisma.md), [TypeORM](${SITE}/data/typeorm.md) (\`@nestjs/typeorm\`), [MongoDB](${SITE}/data/mongodb.md) (\`@nestjs/mongoose\`) or [Sequelize](${SITE}/data/sequelize.md) (\`@nestjs/sequelize\`).
- Configuration: [Configuration](${SITE}/application/configuration.md) (\`@nestjs/config\`). Rate limiting: [Rate limiting](${SITE}/security/rate-limiting.md) (\`@nestjs/throttler\`). Caching: [Caching](${SITE}/data/caching.md) (\`@nestjs/cache-manager\`). Translations: [Internationalization](${SITE}/application/i18n.md) (\`@nestjs/i18n\`). Health checks: [Health checks](${SITE}/reliability/terminus.md) (\`@nestjs/terminus\`).

A complete application in one file, a small API with validated input. In a project from \`npx @nestjs/cli new\`, after \`npm i zod\`, this can replace \`src/main.ts\`, and \`npm run start:dev\` runs it. It also runs with no scaffolding and no build step, through \`npx tsx main.ts\` with \`experimentalDecorators\` in \`tsconfig.json\`. \`tsx\` emits no decorator metadata, so inject providers there with \`@Inject(TodosService)\`:

\`\`\`typescript
import {
  Body,
  Controller,
  Get,
  Module,
  Post,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { z } from 'zod';

const createTodoSchema = z.object({ title: z.string().min(1) });
type CreateTodo = z.infer<typeof createTodoSchema>;

@Controller('todos')
class TodosController {
  private readonly todos: (CreateTodo & { id: number })[] = [];

  @Get()
  findAll() {
    return this.todos;
  }

  @Post()
  create(@Body({ schema: createTodoSchema }) todo: CreateTodo) {
    const created = { id: this.todos.length + 1, ...todo };
    this.todos.push(created);
    return created;
  }
}

@Module({ controllers: [TodosController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
\`\`\`
`;

const sections = NAV_ITEMS.map(renderSection).filter(Boolean).join('\n');

writeFileSync(OUTPUT_FILE, `${header}\n${sections}`, 'utf-8');

/**
 * `llms-full.txt` is the same chapters inlined rather than linked, so a model
 * can read the whole documentation in one request instead of following 135
 * links. The docs' authoring directives
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
    .replace(/\{\{ '([^']*)' \}\}/g, '$1') // Angular's escaping of braces in inline code
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `# ${item.title}\n\nSource: ${url}\n\n${body}\n`;
}

const chapters = NAV_ITEMS.flatMap((item) =>
  item.children?.length ? item.children : [item],
).flatMap((item) => {
  const body = chapterBody(item);
  return body ? [{ item, body }] : [];
});

writeFileSync(
  FULL_OUTPUT_FILE,
  `${header}\n---\n\n${chapters.map(({ body }) => body).join('\n---\n\n')}`,
  'utf-8',
);

// Wiped first so a renamed route cannot leave its old .md behind.
rmSync(MARKDOWN_DIR, { recursive: true, force: true });
for (const { item, body } of chapters) {
  const name = item.path === '/' ? 'index' : item.path.replace(/^\//, '');
  const file = resolve(MARKDOWN_DIR, `${name}.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body, 'utf-8');
}

/**
 * `sitemap.xml` lists every chapter's route, so search engines find a new
 * chapter without waiting for a link to it. llms.txt is for language models,
 * and markdown, so it can't serve as one.
 *
 * `lastmod` is the date of the last commit to the chapter's markdown file. A
 * shallow clone knows only its newest commit and would stamp every chapter
 * with today, so there the dates are left out rather than made up.
 */
function git(...args: string[]): string {
  return execFileSync('git', args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
  }).trim();
}

function lastModified(path: string): string {
  try {
    return git(
      'log',
      '-1',
      '--format=%cs',
      '--',
      `content/${contentFileFor(path)}.md`,
    );
  } catch {
    return '';
  }
}

let withDates: boolean;
try {
  withDates = git('rev-parse', '--is-shallow-repository') === 'false';
} catch {
  withDates = false;
}

const urls = chapters.map(({ item }) => {
  const loc = item.path === '/' ? `${SITE}/` : `${SITE}${item.path}`;
  const lastmod = withDates ? lastModified(item.path!) : '';
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    '  </url>',
  ].join('\n');
});

writeFileSync(
  SITEMAP_FILE,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
  'utf-8',
);

const entryCount = (sections.match(/^- \[/gm) ?? []).length;
console.log(
  `Generated src/llms.txt (${entryCount} chapters), src/llms-full.txt, ${chapters.length} files in src/md/ and src/sitemap.xml.`,
);
