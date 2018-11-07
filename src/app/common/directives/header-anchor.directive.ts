import {AfterViewInit, Directive, ElementRef, Input, Renderer2} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Directive({
  selector: 'h3,h4',
})
export class HeaderAnchorDirective implements AfterViewInit {

  @Input('id') public overriddenId: string | undefined;

  constructor (private elementRef: ElementRef<HTMLHeadingElement>,
               private renderer: Renderer2,
               private route: ActivatedRoute,
               private router: Router) {
  }

  private getImplicitId (): string {
    const content = this.elementRef.nativeElement.innerText;
    return content.replace(/\s/g, '-').toLocaleLowerCase();
  }

  public ngAfterViewInit (): void {
    const id = this.overriddenId == null ? this.getImplicitId() : this.overriddenId;
    if (this.overriddenId == null) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'id', id);
    }

    const anchor = this.renderer.createElement('a');
    this.renderer.setProperty(anchor, 'href', `${ this.router.url.split('#')[0] }#${ id }`);

    const octothorpe = this.renderer.createText('#');
    this.renderer.appendChild(anchor, octothorpe);
    this.renderer.appendChild(this.elementRef.nativeElement, anchor);
  }

}
