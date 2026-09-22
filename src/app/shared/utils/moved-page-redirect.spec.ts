import { TestBed } from '@angular/core/testing';
import {
  PartialMatchRouteSnapshot,
  provideRouter,
  UrlTree,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { movedTo } from './moved-page-redirect';

function redirect(
  redirectFn: ReturnType<typeof movedTo>,
  { queryParams = {}, fragment = null }: Partial<PartialMatchRouteSnapshot>,
): string {
  const tree = TestBed.runInInjectionContext(() =>
    redirectFn({ queryParams, fragment } as PartialMatchRouteSnapshot),
  );
  return (tree as UrlTree).toString();
}

describe('movedTo', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('redirects to the new URL', () => {
    expect(redirect(movedTo('/application/validation'), {})).toBe(
      '/application/validation',
    );
  });

  it('keeps the fragment and query parameters of the old URL', () => {
    expect(
      redirect(movedTo('/application/validation'), {
        fragment: 'schema-based-validation',
        queryParams: { tab: 'js' },
      }),
    ).toBe('/application/validation?tab=js#schema-based-validation');
  });

  it('opens the default fragment only when the old URL has none', () => {
    const merged = movedTo('/http/file-upload', 'streaming-files');
    expect(redirect(merged, {})).toBe('/http/file-upload#streaming-files');
    expect(redirect(merged, { fragment: 'setting-headers' })).toBe(
      '/http/file-upload#setting-headers',
    );
  });
});
