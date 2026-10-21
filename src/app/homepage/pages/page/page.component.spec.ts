import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { packageManagerLabel } from '../../../shared/utils/package-managers';
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

// Two install commands as the docs build renders them, one of them in a hint
@Component({
  selector: 'app-test-install-page',
  template: `
    <div class="pm-switch"><div class="filename"><button type="button" aria-label="Package manager: npm, switch to yarn">npm</button></div><pre><code class="language-bash">
$ npm i zod
</code></pre></div>
    <blockquote class="warning">
      <div class="pm-switch"><div class="filename"><button type="button" aria-label="Package manager: npm, switch to yarn">npm</button></div><pre><code class="language-shell">
$ npm i -g typescript
$ tsc --init
</code></pre></div>
    </blockquote>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestInstallPageComponent extends BasePageComponent {}

describe('BasePageComponent', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [
        TestPageComponent,
        TestInstallPageComponent,
        MiddlewaresComponent,
      ],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

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

  describe('package manager switch', () => {
    function createPage() {
      const fixture = TestBed.createComponent(TestInstallPageComponent);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    function blocks(element: HTMLElement) {
      return Array.from(element.querySelectorAll('.pm-switch'));
    }

    // The package manager every block shows, checking its switch agrees
    function shown(element: HTMLElement) {
      return blocks(element).map((block) => {
        const button = block.querySelector('button');
        expect(button.getAttribute('aria-label')).toBe(
          packageManagerLabel(button.textContent),
        );
        return button.textContent;
      });
    }

    function commands(element: HTMLElement) {
      return blocks(element).map((block) =>
        block.querySelector('code').textContent.trim(),
      );
    }

    function clickSwitch(element: HTMLElement, index: number) {
      blocks(element)[index].querySelector('button').click();
    }

    it('shows npm until another package manager is picked', () => {
      const element = createPage();
      element.querySelector('code').click();

      expect(shown(element)).toEqual(['npm', 'npm']);
      expect(commands(element)).toEqual([
        '$ npm i zod',
        '$ npm i -g typescript\n$ tsc --init',
      ]);
    });

    it('switches every block on a click and remembers the choice', () => {
      const element = createPage();
      clickSwitch(element, 1);

      expect(shown(element)).toEqual(['yarn', 'yarn']);
      expect(commands(element)).toEqual([
        '$ yarn add zod',
        '$ yarn global add typescript\n$ tsc --init',
      ]);
      expect(element.querySelector('code .token.function')?.textContent).toBe(
        'yarn',
      );
      expect(element.querySelector('[role="status"]').textContent).toBe(
        'Showing yarn commands',
      );
      expect(localStorage.getItem('package-manager')).toBe('yarn');
    });

    it('goes from npm to bun, then back to the npm markup', () => {
      const element = createPage();
      const npm = blocks(element).map((block) => block.innerHTML);

      const picked = [0, 1, 0].map((index) => {
        clickSwitch(element, index);
        return shown(element);
      });
      expect(picked).toEqual([
        ['yarn', 'yarn'],
        ['pnpm', 'pnpm'],
        ['bun', 'bun'],
      ]);
      expect(commands(element)).toEqual([
        '$ bun add zod',
        '$ bun add -g typescript\n$ tsc --init',
      ]);

      clickSwitch(element, 1);
      expect(shown(element)).toEqual(['npm', 'npm']);
      expect(blocks(element).map((block) => block.innerHTML)).toEqual(npm);
      expect(localStorage.getItem('package-manager')).toBe('npm');
    });

    it('shows the package manager picked earlier', () => {
      localStorage.setItem('package-manager', 'pnpm');
      const element = createPage();
      expect(shown(element)).toEqual(['pnpm', 'pnpm']);
      expect(commands(element)[0]).toBe('$ pnpm add zod');
      expect(element.querySelector('[role="status"]').textContent).toBe('');

      localStorage.setItem('package-manager', 'deno');
      expect(shown(createPage())).toEqual(['npm', 'npm']);
    });

    it('works when storage is blocked', () => {
      const blocked = () => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      };
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
      const errors = vi.spyOn(console, 'error');
      const element = createPage();
      expect(shown(element)).toEqual(['npm', 'npm']);

      clickSwitch(element, 0);
      clickSwitch(element, 1);
      expect(shown(element)).toEqual(['pnpm', 'pnpm']);
      expect(errors).not.toHaveBeenCalled();
    });
  });
});
