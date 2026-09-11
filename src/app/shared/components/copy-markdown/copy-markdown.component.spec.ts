import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { CopyMarkdownComponent } from './copy-markdown.component';

@Component({ template: '', standalone: true })
class StubPageComponent {}

describe('CopyMarkdownComponent', () => {
  let fixture: ComponentFixture<CopyMarkdownComponent>;
  let router: Router;

  const button = () =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyMarkdownComponent],
      providers: [
        provideRouter([
          { path: '', component: StubPageComponent },
          { path: 'controllers', component: StubPageComponent },
          { path: 'enterprise', component: StubPageComponent },
        ]),
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  afterEach(() => vi.unstubAllGlobals());

  async function renderAt(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(CopyMarkdownComponent);
    fixture.detectChanges();
  }

  it('points at the markdown file next to the route', async () => {
    await renderAt('/controllers');
    expect(fixture.componentInstance.markdownUrl).toBe('/controllers.md');

    await router.navigateByUrl('/');
    expect(fixture.componentInstance.markdownUrl).toBe('/index.md');
  });

  it('renders nothing on a page outside the sidebar', async () => {
    await renderAt('/enterprise');
    expect(button()).toBeNull();
  });

  it('copies the fetched markdown and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('ClipboardItem', undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: async () => '# Controllers' }),
    );
    await renderAt('/controllers');

    await fixture.componentInstance.onCopy();
    fixture.detectChanges();

    expect(fetch).toHaveBeenCalledWith('/controllers.md');
    expect(writeText).toHaveBeenCalledWith('# Controllers');
    expect(button().textContent).toContain('Copied');
  });
});
