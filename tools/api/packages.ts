/**
 * The single list of packages the API reference documents. The source fetcher
 * (`fetch-sources.ts`) clones every repository listed here, and the compiler
 * (`compiler/`) documents every entry point listed here, so adding a package
 * is one entry in this file.
 *
 * Runs under both Node's built-in type stripping and ts-node: keep it free of
 * imports and of syntax that needs transforming (enums, namespaces, ...).
 */

// Overview groups, named and ordered like the docs sidebar.
export const PackageGroup = {
  Fundamentals: 'Fundamentals',
  Application: 'Application',
  Data: 'Data',
  Security: 'Security',
  HTTP: 'HTTP',
  Observability: 'Observability',
  Reliability: 'Reliability',
  GraphQL: 'GraphQL',
  WebSockets: 'WebSockets',
  Microservices: 'Microservices',
  OpenAPI: 'OpenAPI',
  Recipes: 'Recipes',
} as const;

export type PackageGroup = (typeof PackageGroup)[keyof typeof PackageGroup];

/** Overview order; object key order is insertion order. */
export const PACKAGE_GROUPS: PackageGroup[] = Object.values(PackageGroup);

export interface PackageEntry {
  /** Entry point, relative to the repository root. */
  entry: string;
  group: PackageGroup;
}

export interface SourceRepository {
  /** Repository in the `nestjs` GitHub organisation, and its folder in `sources/`. */
  name: string;
  /** Branch or tag to check out. Defaults to the repository's default branch. */
  ref?: string;
  /**
   * Every export is public unless tagged `@internal`. Without this flag only
   * exports tagged `@publicApi` are documented.
   */
  publicByDefault?: boolean;
  entries: PackageEntry[];
}

const { Fundamentals, Application, Data, Security, HTTP, Observability } =
  PackageGroup;
const { Reliability, GraphQL, WebSockets, Microservices, OpenAPI, Recipes } =
  PackageGroup;

/** Order within a group is the order on the overview page. */
export const REPOSITORIES: SourceRepository[] = [
  {
    name: 'nest',
    entries: [
      { entry: 'packages/core/index.ts', group: Fundamentals },
      { entry: 'packages/common/index.ts', group: Fundamentals },
      { entry: 'packages/microservices/index.ts', group: Microservices },
      { entry: 'packages/platform-express/index.ts', group: HTTP },
      { entry: 'packages/platform-fastify/index.ts', group: HTTP },
      { entry: 'packages/platform-socket.io/index.ts', group: WebSockets },
      { entry: 'packages/platform-ws/index.ts', group: WebSockets },
      { entry: 'packages/testing/index.ts', group: Fundamentals },
      { entry: 'packages/websockets/index.ts', group: WebSockets },
    ],
  },
  { name: 'cache-manager', entries: [{ entry: 'lib/index.ts', group: Data }] },
  { name: 'terminus', entries: [{ entry: 'lib/index.ts', group: Reliability }] },
  {
    name: 'graphql',
    entries: [
      { entry: 'packages/apollo/lib/index.ts', group: GraphQL },
      { entry: 'packages/graphql/lib/index.ts', group: GraphQL },
      { entry: 'packages/mercurius/lib/index.ts', group: GraphQL },
    ],
  },
  { name: 'swagger', entries: [{ entry: 'lib/index.ts', group: OpenAPI }] },
  { name: 'config', entries: [{ entry: 'lib/index.ts', group: Application }] },
  { name: 'mapped-types', entries: [{ entry: 'lib/index.ts', group: GraphQL }] },
  { name: 'throttler', entries: [{ entry: 'src/index.ts', group: Security }] },
  { name: 'passport', entries: [{ entry: 'lib/index.ts', group: Recipes }] },
  { name: 'jwt', entries: [{ entry: 'lib/index.ts', group: Security }] },
  { name: 'event-emitter', entries: [{ entry: 'lib/index.ts', group: Application }] },
  { name: 'schedule', entries: [{ entry: 'lib/index.ts', group: Application }] },
  { name: 'axios', entries: [{ entry: 'lib/index.ts', group: Application }] },
  { name: 'cqrs', entries: [{ entry: 'src/index.ts', group: Recipes }] },
  { name: 'typeorm', entries: [{ entry: 'lib/index.ts', group: Data }] },
  { name: 'sequelize', entries: [{ entry: 'lib/index.ts', group: Data }] },
  { name: 'mongoose', entries: [{ entry: 'lib/index.ts', group: Data }] },
  { name: 'serve-static', entries: [{ entry: 'lib/index.ts', group: Recipes }] },
  {
    name: 'bull',
    entries: [
      { entry: 'packages/bull/lib/index.ts', group: Application },
      { entry: 'packages/bullmq/lib/index.ts', group: Application },
    ],
  },
  { name: 'elasticsearch', entries: [{ entry: 'lib/index.ts', group: Data }] },
  {
    name: 'authentication',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Security }],
  },
  {
    name: 'authorization',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Security }],
  },
  {
    name: 'azure-database',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Data }],
  },
  {
    name: 'azure-func-http',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: HTTP }],
  },
  {
    name: 'azure-storage',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Data }],
  },
  {
    name: 'drizzle',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Data }],
  },
  {
    name: 'http-client',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Application }],
  },
  {
    name: 'i18n',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Application }],
  },
  {
    name: 'idempotency',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Reliability }],
  },
  {
    name: 'locks',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Reliability }],
  },
  {
    name: 'mail',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Application }],
  },
  {
    name: 'ng-universal',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Recipes }],
  },
  {
    name: 'observe',
    publicByDefault: true,
    entries: [{ entry: 'src/index.ts', group: Observability }],
  },
  {
    name: 'outbox',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Reliability }],
  },
  {
    name: 'resilience',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Reliability }],
  },
  {
    name: 'storage',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Application }],
  },
  {
    name: 'store-kit',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Application }],
  },
  {
    name: 'webhooks',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: HTTP }],
  },
  {
    name: 'workflows',
    publicByDefault: true,
    entries: [{ entry: 'lib/index.ts', group: Reliability }],
  },
];

export interface ResolvedPackage {
  /** Entry point, relative to `sources/`, e.g. `nest/packages/core/index.ts`. */
  path: string;
  group: PackageGroup;
  publicByDefault: boolean;
}

/** Every entry point across all repositories, in config order. */
export const PACKAGES: ResolvedPackage[] = REPOSITORIES.flatMap((repo) =>
  repo.entries.map(({ entry, group }) => ({
    path: `${repo.name}/${entry}`,
    group,
    publicByDefault: !!repo.publicByDefault,
  })),
);
