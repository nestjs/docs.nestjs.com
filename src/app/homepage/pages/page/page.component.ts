import {
  AfterViewChecked,
  AfterViewInit,
  ApplicationRef,
  Component,
  ElementRef,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { Meta } from '@angular/platform-browser';
import * as Prism from 'prismjs';
import 'prismjs/prism';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';

/** Roughly what a search result shows before it cuts the snippet off. */
const DESCRIPTION_MAX_LENGTH = 160;

/**
 * Whole sentences from the start of `text` that fit the limit, or the first
 * sentence cut at a word boundary when even that one is too long.
 *
 * A sentence ends at punctuation followed by whitespace - the rule llms.txt
 * uses - so the dots in "Node.js" or "e.g.," do not split one.
 */
function summarize(text: string): string {
  if (text.length <= DESCRIPTION_MAX_LENGTH) {
    return text;
  }
  let summary = '';
  let rest = text;
  while (rest) {
    const sentence = rest.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? rest;
    const candidate = summary ? `${summary} ${sentence}` : sentence;
    if (candidate.length > DESCRIPTION_MAX_LENGTH) {
      break;
    }
    summary = candidate;
    rest = rest.slice(sentence.length).trimStart();
  }
  return (
    summary ||
    text.slice(0, DESCRIPTION_MAX_LENGTH - 1).replace(/\s+\S*$/, '') + '…'
  );
}

@Component({
    selector: 'app-base-page',
    template: ``,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: true,
})
export class BasePageComponent implements AfterViewChecked, AfterViewInit {
  private isHljsInitialized = false;
  private readonly metaService = inject(Meta);

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

  ngAfterViewInit() {
    this.updateDescription();
  }

  ngAfterViewChecked() {
    this.initHljs();
  }

  /**
   * index.html carries one generic description for the whole site. Every
   * chapter opens with a paragraph written as its summary, so that paragraph
   * becomes the page's description - the same source llms.txt uses.
   */
  private updateDescription() {
    const paragraph = this.nativeElement.querySelector('.content-inner > p');
    const text = paragraph?.textContent?.replace(/\s+/g, ' ').trim();
    if (!text) {
      return;
    }
    const content = summarize(text);
    this.metaService.updateTag({ name: 'description', content });
    this.metaService.updateTag({ property: 'og:description', content });
    this.metaService.updateTag({ name: 'twitter:description', content });
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
