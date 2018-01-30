import {
  Directive,
  ElementRef,
  AfterViewChecked,
  Input,
  HostListener,
  Renderer2,
  NgZone,
} from '@angular/core';
import { isBrowser } from '@angular/flex-layout'

@Directive({
  selector: '[matchHeight]',
})
export class MatchHeightDirective implements AfterViewChecked {
  constructor(
    private readonly zone: NgZone,
    private readonly renderer: Renderer2,
    private readonly el: ElementRef,
  ) {}

  ngAfterViewChecked() {
    setTimeout(
      () => this.zone.run(() => this.matchHeight(this.el.nativeElement)),
      800,
    );
  }

  @HostListener('window:resize')
  onResize() {
    setTimeout(() => this.matchHeight(this.el.nativeElement), 500);
  }

  matchHeight(parent: HTMLElement) {
    if (!parent || !isBrowser()) {
      return;
    }
    const children = Array.from(parent.children);
    children.forEach((x: HTMLElement) => {
      this.renderer.setStyle(x, 'height', 'initial');
    });
    const itemHeights = children.map(x => x.getBoundingClientRect().height);
    const maxHeight = itemHeights.reduce((prev, curr) => {
      return curr > prev ? curr : prev;
    }, 0);

    children.forEach((x: HTMLElement) =>
      this.renderer.setStyle(x, 'height', `${maxHeight}px`),
    );
  }
}
