import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MiddlewaresComponent } from '../middlewares/middlewares.component';
import { BasePageComponent } from './page.component';

// Shaped like a generated page: OnPush, with the markup in its own template
@Component({
  selector: 'app-test-page',
  template: `
    <div class="content-inner">
      <p>Middleware is a function called before the route handler.</p>
      <a href="#binding">Binding</a>
      <pre><code class="language-typescript">const answer = 42;</code></pre>
    </div>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestPageComponent extends BasePageComponent {}

describe('BasePageComponent', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [TestPageComponent, MiddlewaresComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => vi.useRealTimers());

  it('initializes the page markup', () => {
    const fixture = TestBed.createComponent(TestPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.isMarkupReady).toBe(true);
    expect(element.querySelector('code .token')).not.toBeNull();
    expect(element.querySelector('a')?.getAttribute('href')).toBe(
      `${window.location.pathname}#binding`,
    );
    expect(
      TestBed.inject(Meta).getTag('name="description"')?.content,
    ).toBe('Middleware is a function called before the route handler.');
  });

  it('initializes a hand-written page', () => {
    const fixture = TestBed.createComponent(MiddlewaresComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h3')?.textContent).toContain('Middleware');
    expect(fixture.componentInstance.isMarkupReady).toBe(true);
    expect(element.querySelector('code.language-typescript .token')).not.toBeNull();
  });
});
