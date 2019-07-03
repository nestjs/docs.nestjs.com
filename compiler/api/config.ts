import { resolve } from 'path';

export const DOC_PATH_PREFIX = '/api';
export const PROJECT_ROOT = resolve(__dirname, '../../sources/');
export const OUTPUT_PATH = resolve(__dirname, '../../src/generated/docs/api');

export const PACKAGES_PATH: string[] = [
  './nest/packages/core/index.ts',
  // TODO: Delete me
  './nest/packages/core/nest-factory.ts',
  './nest/packages/common/index.ts',
  './nest/packages/microservices/index.ts',
  './nest/packages/platform-express/index.ts',
  './nest/packages/platform-fastify/index.ts',
  './nest/packages/platform-socket.io/index.ts',
  './nest/packages/platform-ws/index.ts',
  './nest/packages/testing/index.ts',
  './nest/packages/websockets/index.ts',

  './terminus/lib/index.ts',
  './passport/lib/index.ts',
  './elasticsearch/lib/index.ts',
  './cqrs/src/index.ts',
  './jwt/lib/index.ts',
  './graphql/lib/index.ts',
  './mongoose/lib/index.ts',
  './ng-universal/lib/index.ts',
];
