import { describe, expect, it } from 'vitest';
import {
  buildApiIndex,
  resolveApiLink,
} from '../../../../../tools/transforms/content-package/services/api-links';

const index = buildApiIndex([
  { title: 'common', items: [
    { title: 'Injectable', path: '/api/common/Injectable' },
    { title: 'Query', path: '/api/common/Query' },
  ] },
  { title: 'graphql', items: [{ title: 'Query', path: '/api/graphql/Query' }] },
  { title: 'terminus', items: [{ title: 'MongooseHealthIndicator', path: '/api/terminus/MongooseHealthIndicator' }] },
  { title: 'bull', items: [{ title: 'BullModule', path: '/api/bull/BullModule' }] },
  { title: 'bullmq', items: [{ title: 'BullModule', path: '/api/bullmq/BullModule' }] },
  { title: 'authentication', items: [{ title: 'github', path: '/api/authentication/github' }] },
  { title: 'observe', items: [{ title: 'Path', path: '/api/observe/Path' }] },
]);

const link = (code: string, page = '') => resolveApiLink(code, page, index);

describe('resolveApiLink', () => {
  it('links an export, written as a name, decorator or call', () => {
    expect(link('MongooseHealthIndicator')).toBe('/api/terminus/MongooseHealthIndicator');
    expect(link('@Injectable()')).toBe('/api/common/Injectable');
    expect(link('github()')).toBe('/api/authentication/github');
  });

  it('leaves code that names no export alone', () => {
    expect(link('app.listen()')).toBeNull();
    expect(link('Unknown')).toBeNull();
    expect(link('Injectable.forRoot()')).toBeNull();
  });

  it('only links a lowercase export when it is written as a call', () => {
    expect(link('github')).toBeNull();
  });

  it('never links an excluded name', () => {
    expect(link('Path')).toBeNull();
  });

  it('resolves a shared name to the package the page mentions most', () => {
    const page = 'Install `@nestjs/bullmq`. Unlike @nestjs/bull, @nestjs/bullmq ...';
    expect(link('BullModule', page)).toBe('/api/bullmq/BullModule');
    expect(link('Query', 'npm i @nestjs/graphql')).toBe('/api/graphql/Query');
  });

  it('falls back to the core packages, else leaves a shared name unlinked', () => {
    expect(link('Query', 'A REST controller')).toBe('/api/common/Query');
    expect(link('BullModule', '@nestjs/bull and @nestjs/bullmq')).toBeNull();
  });
});
