import { describe, expect, it } from 'vitest';
import {
  packageManagerLabel,
  packageManagerVariants,
} from './package-managers';

describe('packageManagerVariants', () => {
  it.each([
    [
      '$ npm i --save @nestjs/config',
      '$ yarn add @nestjs/config',
      '$ pnpm add @nestjs/config',
      '$ bun add @nestjs/config',
    ],
    [
      '$ npm install @nestjs/cache-manager cache-manager',
      '$ yarn add @nestjs/cache-manager cache-manager',
      '$ pnpm add @nestjs/cache-manager cache-manager',
      '$ bun add @nestjs/cache-manager cache-manager',
    ],
    [
      '$ npm i -D @types/multer',
      '$ yarn add -D @types/multer',
      '$ pnpm add -D @types/multer',
      '$ bun add -D @types/multer',
    ],
    [
      '$ npm install prisma@7 dotenv --save-dev',
      '$ yarn add -D prisma@7 dotenv',
      '$ pnpm add -D prisma@7 dotenv',
      '$ bun add -D prisma@7 dotenv',
    ],
    [
      '$ npm i -g @nestjs/cli\n$ nest new project-name',
      '$ yarn global add @nestjs/cli\n$ nest new project-name',
      '$ pnpm add -g @nestjs/cli\n$ nest new project-name',
      '$ bun add -g @nestjs/cli\n$ nest new project-name',
    ],
    [
      '$ npm uninstall nats\n$ npm install @nats-io/transport-node',
      '$ yarn remove nats\n$ yarn add @nats-io/transport-node',
      '$ pnpm remove nats\n$ pnpm add @nats-io/transport-node',
      '$ bun remove nats\n$ bun add @nats-io/transport-node',
    ],
    [
      '# For Express\n$ npm i @nestjs/graphql\n\n# For Fastify\n# npm i mercurius',
      '# For Express\n$ yarn add @nestjs/graphql\n\n# For Fastify\n# yarn add mercurius',
      '# For Express\n$ pnpm add @nestjs/graphql\n\n# For Fastify\n# pnpm add mercurius',
      '# For Express\n$ bun add @nestjs/graphql\n\n# For Fastify\n# bun add mercurius',
    ],
  ])('converts %j', (npm, yarn, pnpm, bun) => {
    expect(packageManagerVariants(npm)).toEqual([npm, yarn, pnpm, bun]);
  });

  it.each([
    '$ npm install',
    '$ npm run start',
    '$ npx prisma generate',
    '$ nest new project-name',
    '# npm i only-in-a-comment',
    '$ npm i -D',
    '$ npm i -g -D @nestjs/cli',
    '$ npm i --legacy-peer-deps @nestjs/config',
    '$ npm uninstall --save nats',
    '$ npm i @nestjs/config && npm run start',
    '$ npm i @nestjs/config > install.log',
    '$ npm i "@nestjs/config"',
    '$ DEBUG=1 npm i @nestjs/config',
    '  $ npm i @nestjs/config',
    '$ npm  i @nestjs/config',
    '$ npm i @nestjs/config\n$ npx nest info',
    '# npm is not needed\n$ npm i @nestjs/config',
    'added 1 package\n$ npm i @nestjs/config',
    'RUN npm install @nestjs/config',
  ])('leaves %j as it is', (code) => {
    expect(packageManagerVariants(code)).toBeNull();
  });
});

describe('packageManagerLabel', () => {
  it('names the package manager shown and the next one', () => {
    expect(packageManagerLabel('npm')).toBe(
      'Package manager: npm, switch to yarn',
    );
    expect(packageManagerLabel('bun')).toBe(
      'Package manager: bun, switch to npm',
    );
  });
});
