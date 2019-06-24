import { resolve } from 'path';

export const DOC_PATH_PREFIX = '/api';
export const PROJECT_ROOT = resolve(__dirname, '../../sources/');
export const OUTPUT_PATH = resolve(__dirname, '../../src/generated/docs/api');

export const PACKAGES_PATH: string[] = [
  './nest/packages/core/index.ts',
  './nest/packages/common/index.ts',
  './terminus/lib/index.ts',
  './passport/lib/index.ts',
  './elasticsearch/lib/index.ts',
  './cqrs/src/index.ts',
];
