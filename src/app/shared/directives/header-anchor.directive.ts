import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  Input,
  Renderer2,
} from '@angular/core';
import { Router } from '@angular/router';

@Directive({
    selector: '[appAnchor]',
    standalone: true,
})
export class HeaderAnchorDirective implements AfterViewInit {
  private readonly elementRef = inject<ElementRef<HTMLHeadingElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);

  @Input() public id: string | undefined;

  public ngAfterViewInit(): void {
    const id = this.id == null ? this.getImplicitId() : this.id;
    if (this.id == null) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'id', id);
    }

    const anchor = this.renderer.createElement('a');
    this.renderer.setProperty(
      anchor,
      'href',
      `${this.router.url.split('#')[0]}#${id}`,
    );

    const octothorpe = this.renderer.createText('#');
    this.renderer.appendChild(anchor, octothorpe);
    this.renderer.appendChild(this.elementRef.nativeElement, anchor);
  }

  private getImplicitId(): string {
    const content = this.elementRef.nativeElement.innerText;
    return content.replace(/\s/g, '-').toLocaleLowerCase();
  }
}
