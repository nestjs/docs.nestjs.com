import {
  AfterViewChecked,
  ApplicationRef,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import * as Prism from 'prismjs';
import 'prismjs/prism';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';

@Component({
  selector: 'app-base-page',
  template: ``,
})
export class BasePageComponent implements AfterViewChecked, OnDestroy {
  private isHljsInitialized = false;
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  public copyButtonState: 'idle' | 'copied' | 'error' = 'idle';
  private copyResetTimeout: number | null = null;

  constructor(
    private readonly applicationRef: ApplicationRef,
    private readonly el: ElementRef,
  ) {}

  get nativeElement(): HTMLElement {
    return this.el.nativeElement;
  }

  get isMarkupReady(): boolean {
    return this.isHljsInitialized;
  }

  private isElement(target: EventTarget | null): target is Element {
    return target instanceof Element;
  }

  async copyAsMarkdown(event: Event) {
    if (!this.isElement(event.target)) {
      return;
    }

    const buttonElement = event.target.closest('button');
    if (!buttonElement) {
      return;
    }

    try {
      // Get the current route path (matches doc.id from Dgeni)
      const currentPath = this.router.url.slice(1);
      const markdownUrl = `/assets/content/${currentPath}.md`;

      // Fetch the cleaned Markdown file
      const markdown = await firstValueFrom(
        this.http.get(markdownUrl, { responseType: 'text' }),
      );

      const canCopy = markdown && navigator.clipboard;
      if (!canCopy) {
        this.setCopyError(buttonElement);
        return;
      }

      await navigator.clipboard.writeText(markdown);
      this.setCopySuccess(buttonElement);
    } catch (error) {
      console.error('Failed to copy markdown:', error);
      this.setCopyError(buttonElement);
    }
  }

  private setCopySuccess(buttonElement: Element) {
    this.copyButtonState = 'copied';
    buttonElement.classList.add('content-action--success');
    buttonElement.innerHTML = '<i class="fas fa-check"></i>';
    buttonElement.setAttribute('aria-label', 'Copied');
    buttonElement.setAttribute('title', 'Copied');
  }

  private setCopyError(buttonElement: Element) {
    this.copyButtonState = 'error';
    buttonElement.classList.add('content-action--error');
    buttonElement.innerHTML = '<i class="fas fa-times"></i>';
    buttonElement.setAttribute('aria-label', 'Copy failed');
    buttonElement.setAttribute('title', 'Copy failed');
  }

  onCopyButtonMouseLeave(event: Event) {
    if (this.copyButtonState === 'idle') {
      return;
    }

    if (this.copyResetTimeout) {
      clearTimeout(this.copyResetTimeout);
    }

    this.copyResetTimeout = setTimeout(() => {
      this.copyButtonState = 'idle';

      if (!this.isElement(event.target)) {
        return;
      }

      const buttonElement = event.target.closest('button');
      if (!buttonElement) {
        return;
      }

      // Reset to copy icon
      buttonElement.className = 'content-action';
      buttonElement.innerHTML = '<i class="fas fa-copy"></i>';
      buttonElement.setAttribute('aria-label', 'Copy as Markdown');
      buttonElement.setAttribute('title', 'Copy as Markdown');
      this.copyResetTimeout = null;
    }, 500) as unknown as number;
  }

  ngOnDestroy() {
    // Clean up timeout if component is destroyed
    if (this.copyResetTimeout) {
      clearTimeout(this.copyResetTimeout);
    }
  }

  ngAfterViewChecked() {
    this.initHljs();
  }

  private initHljs() {
    if (this.isHljsInitialized || !this.el) {
      return;
    }
    const tags = this.el.nativeElement.querySelectorAll('code');
    [].forEach.call(tags, (code: HTMLElement) => {
      if (code.className) {
        Prism.highlightElement(code);
        this.isHljsInitialized = true;
      }
    });
    setTimeout(() => this.applicationRef.tick(), 1000);
  }
}
