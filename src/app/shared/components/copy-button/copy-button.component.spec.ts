import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CopyButtonComponent } from './copy-button.component';

@Component({
  template: `
    <app-copy-button>
      <pre class="hide"><code>hidden variant</code></pre>
      <pre><code>const answer = 42;</code></pre>
    </app-copy-button>
  `,
  standalone: true,
  imports: [CopyButtonComponent],
})
class HostComponent {}

describe('CopyButtonComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let writeText: ReturnType<typeof vi.fn>;

  const button = () =>
    fixture.nativeElement.querySelector('button.clipboard') as HTMLButtonElement;
  const icon = () =>
    (
      fixture.nativeElement.querySelector('mat-icon') as HTMLElement
    ).textContent.trim();

  beforeEach(async () => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('copies the visible code block', () => {
    button().click();
    expect(writeText).toHaveBeenCalledWith('const answer = 42;');
  });

  // The component is OnPush: the feedback only shows if the button renders itself
  it('shows a check mark, then the copy icon again after 2 seconds', () => {
    expect(icon()).toBe('content_copy');

    button().click();

    expect(icon()).toBe('check');
    expect(button().classList).toContain('copied');

    vi.advanceTimersByTime(2000);

    expect(icon()).toBe('content_copy');
    expect(button().classList).not.toContain('copied');
  });
});
