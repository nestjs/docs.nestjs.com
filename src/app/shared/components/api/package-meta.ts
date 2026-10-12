// Package title -> oklch hue. Lightness/chroma are fixed in the stylesheet so
// every package sits in the same perceptual band; only the hue differs.
// core uses the hue of the Nest red (#ea2845 -> ~20deg).
const PACKAGE_HUES: Record<string, number> = {
  core: 20,
  common: 250,
  microservices: 150,
  'platform-express': 300,
  'platform-fastify': 320,
  'platform-socket.io': 200,
  'platform-ws': 210,
  websockets: 195,
  testing: 80,
  'cache-manager': 60,
  terminus: 140,
  throttler: 40,
  apollo: 290,
  graphql: 340,
  mercurius: 280,
  swagger: 130,
  config: 240,
  'mapped-types': 170,
  passport: 230,
  jwt: 90,
  axios: 270,
  cqrs: 190,
  typeorm: 30,
  sequelize: 245,
  mongoose: 145,
  'serve-static': 70,
  bull: 330,
  bullmq: 335,
  elasticsearch: 175,
  'event-emitter': 100,
  schedule: 260,
  authentication: 215,
  authorization: 225,
  'azure-database': 205,
  'azure-func-http': 185,
  'azure-storage': 220,
  drizzle: 110,
  'http-client': 265,
  i18n: 160,
  idempotency: 275,
  locks: 235,
  mail: 10,
  'ng-universal': 350,
  observe: 85,
  outbox: 15,
  resilience: 255,
  storage: 45,
  'store-kit': 305,
  webhooks: 285,
  workflows: 180
};

// Package title -> Phosphor icon name (https://phosphoricons.com).
const PACKAGE_ICONS: Record<string, string> = {
  core: 'cpu',
  common: 'stack',
  microservices: 'graph',
  'platform-express': 'hard-drives',
  'platform-fastify': 'hard-drives',
  'platform-socket.io': 'broadcast',
  'platform-ws': 'broadcast',
  websockets: 'broadcast',
  testing: 'flask',
  'cache-manager': 'hard-drive',
  terminus: 'heartbeat',
  throttler: 'gauge',
  apollo: 'share-network',
  graphql: 'share-network',
  mercurius: 'share-network',
  swagger: 'file-text',
  config: 'gear',
  'mapped-types': 'shapes',
  passport: 'shield-check',
  jwt: 'key',
  axios: 'globe',
  cqrs: 'git-branch',
  typeorm: 'database',
  sequelize: 'database',
  mongoose: 'leaf',
  'serve-static': 'folder-open',
  bull: 'tray',
  bullmq: 'tray',
  elasticsearch: 'magnifying-glass',
  'event-emitter': 'bell',
  schedule: 'calendar-dots',
  authentication: 'fingerprint',
  authorization: 'user-check',
  'azure-database': 'cloud',
  'azure-func-http': 'cloud-check',
  'azure-storage': 'cloud-arrow-up',
  drizzle: 'drop',
  'http-client': 'link',
  i18n: 'translate',
  idempotency: 'repeat-once',
  locks: 'lock',
  mail: 'envelope',
  'ng-universal': 'flower',
  observe: 'activity',
  outbox: 'paper-plane-tilt',
  resilience: 'shield',
  storage: 'archive',
  'store-kit': 'storefront',
  webhooks: 'webhooks-logo',
  workflows: 'flow-arrow',
};

export function packageHue(title: string): number {
  return PACKAGE_HUES[title] ?? 250;
}

export function packageIcon(title: string): string {
  return PACKAGE_ICONS[title] ?? 'package';
}

export function packageId(name: string): string {
  return 'pkg-' + name.replace(/[^a-z0-9]+/gi, '-');
}

// Sections arrive from api-list.json already ordered by group (see the compiler
// config's PACKAGE_GROUPS); this just splits consecutive sections into groups.
export function groupPackages<T extends { group?: string }>(sections: T[]): { title: string; sections: T[] }[] {
  const groups: { title: string; sections: T[] }[] = [];
  for (const section of sections) {
    const title = section.group ?? 'Other';
    const last = groups[groups.length - 1];
    if (last?.title === title) last.sections.push(section);
    else groups.push({ title, sections: [section] });
  }
  return groups;
}
