import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent canonical URL', () => {
  let component: AppComponent;

  const canonicals = () =>
    Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'),
    );
  const ogUrl = () =>
    document.head
      .querySelector('meta[property="og:url"]')
      ?.getAttribute('content');
  const navigate = (url: string) =>
    component.updateCanonical(new NavigationEnd(1, url, url));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    component = TestBed.createComponent(AppComponent).componentInstance;
  });

  afterEach(() => {
    canonicals().forEach((link) => link.remove());
    document.head.querySelector('meta[property="og:url"]')?.remove();
  });

  it('adds the canonical link that index.html leaves out', () => {
    navigate('/observability/opentelemetry');
    expect(canonicals().map((link) => link.getAttribute('href'))).toEqual([
      'https://docs.nestjs.com/observability/opentelemetry',
    ]);
    expect(ogUrl()).toBe('https://docs.nestjs.com/observability/opentelemetry');
  });

  it('keeps a single link across navigations', () => {
    navigate('/controllers');
    navigate('/providers');
    expect(canonicals().map((link) => link.getAttribute('href'))).toEqual([
      'https://docs.nestjs.com/providers',
    ]);
  });

  it('leaves out the query string and fragment', () => {
    navigate('/pipes?lang=js#binding-pipes');
    expect(canonicals()[0].getAttribute('href')).toBe(
      'https://docs.nestjs.com/pipes',
    );
  });

  it('points the homepage at the site root', () => {
    navigate('/');
    expect(canonicals()[0].getAttribute('href')).toBe('https://docs.nestjs.com');
  });

  describe('markdown link', () => {
    const markdown = () =>
      Array.from(
        document.head.querySelectorAll<HTMLLinkElement>(
          'link[rel="alternate"][type="text/markdown"]',
        ),
      );

    afterEach(() => {
      markdown().forEach((link) => link.remove());
    });

    it('points at the markdown version of the chapter', () => {
      navigate('/controllers');
      navigate('/pipes?lang=js#binding-pipes');
      expect(markdown().map((link) => link.getAttribute('href'))).toEqual([
        'https://docs.nestjs.com/pipes.md',
      ]);
    });

    it('points the homepage at the introduction', () => {
      navigate('/');
      expect(markdown()[0].getAttribute('href')).toBe(
        'https://docs.nestjs.com/index.md',
      );
    });
  });
});
