declare var Prism;
import { ElementRef, AfterViewChecked, Component, ApplicationRef } from '@angular/core';
import { isBrowser } from '@angular/flex-layout'

@Component({
  selector: 'app-base-page',
  template: ``,
})
export class BasePageComponent implements AfterViewChecked {
  private isHljsInitialized = false;

  constructor(
    private readonly applicationRef: ApplicationRef,
    private readonly el: ElementRef) {}

  ngAfterViewChecked() {
    this.initHljs();
  }

  private initHljs() {
    if (this.isHljsInitialized) {
      return;
    }
    const tags = this.el.nativeElement.querySelectorAll('code');
    [].forEach.call(tags, (code: HTMLElement) => {
        if (code.className && isBrowser()) {
          Prism.highlightElement(code);
          this.isHljsInitialized = true;
        }
      }
    );
    setTimeout(() => this.applicationRef.tick(), 100);
  }
}
