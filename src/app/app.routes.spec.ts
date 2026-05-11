import { describe, expect, it } from 'vitest';
import { UrlSegment } from '@angular/router';
import { versionedUrlRedirect } from './shared/utils/versioned-redirect';

function seg(path: string): UrlSegment {
  return { path } as UrlSegment;
}

describe('versionedUrlRedirect', () => {
  it('strips the version prefix and redirects to the matching page', () => {
    expect(versionedUrlRedirect({ url: [seg('v10'), seg('migration-guide')] })).toBe(
      '/migration-guide',
    );
  });

  it('handles nested versioned paths', () => {
    expect(
      versionedUrlRedirect({ url: [seg('v10'), seg('techniques'), seg('caching')] }),
    ).toBe('/techniques/caching');
  });

  it('redirects a versioned root URL to the homepage', () => {
    expect(versionedUrlRedirect({ url: [seg('v10')] })).toBe('/');
  });

  it('redirects unknown paths to the homepage', () => {
    expect(versionedUrlRedirect({ url: [seg('some-nonexistent-page')] })).toBe('/');
  });

  it('redirects an empty URL to the homepage', () => {
    expect(versionedUrlRedirect({ url: [] })).toBe('/');
  });
});
