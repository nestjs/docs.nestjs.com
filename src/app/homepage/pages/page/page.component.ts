import {
  AfterViewChecked,
  ApplicationRef,
  Component,
  ElementRef,
} from '@angular/core';
import * as Prism from 'prismjs';

@Component({
  selector: 'app-base-page',
  template: ``,
})
export class BasePageComponent implements AfterViewChecked {
  private isHljsInitialized = false;

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
    setTimeout(() => this.applicationRef.tick(), 100);
  }
}
