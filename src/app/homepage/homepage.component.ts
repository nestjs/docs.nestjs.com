import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BasePageComponent } from './pages/page/page.component';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomepageComponent implements OnInit, AfterViewInit {
  isSidebarOpened = true;
  previousWidth: number;
  contentRef: HTMLElement;
  isMarkupReady: boolean;

  constructor(
    private readonly cd: ChangeDetectorRef,
    private readonly router: Router,
    private readonly elementRef: ElementRef,
  ) {}

  ngOnInit(): void {
    this.router.events
      .filter(e => e instanceof NavigationEnd)
      .subscribe(() => {
        if (window.innerWidth > 768) {
          return false;
        }
        this.isSidebarOpened = false;
        this.cd.detectChanges();
      });
  }

  ngAfterViewInit() {
    this.checkWindowWidth(window.innerWidth);
  }

  toggleSidebar() {
    this.isSidebarOpened = !this.isSidebarOpened;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.checkWindowWidth(event.target.innerWidth);
  }

  checkWindowWidth(innerWidth?: number) {
    innerWidth = innerWidth ? innerWidth : window.innerWidth;
    if (this.previousWidth !== innerWidth && innerWidth <= 768) {
      this.previousWidth = innerWidth;
      this.isSidebarOpened = false;
      this.cd.detectChanges();
    }
  }

  onRouteActivate(component: BasePageComponent) {
    if (!component) {
      return;
    }
    const nativeElement = component.nativeElement;
    if (!nativeElement) {
      return;
    }
    this.contentRef = nativeElement.querySelector('.content');
    if (this.contentRef && !this.contentRef.querySelector('.carbon-wrapper')) {
      const scriptTag = this.createCarbonScriptTag();
      const carbonWrapper = document.createElement('div');
      carbonWrapper.classList.add('carbon-wrapper');
      carbonWrapper.prepend(scriptTag);

      this.contentRef.prepend(carbonWrapper);
    }
    this.cd.markForCheck();
  }

  createCarbonScriptTag(): HTMLScriptElement {
    const scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.src =
      '//cdn.carbonads.com/carbon.js?serve=CK7I653M&placement=nestjscom';
    scriptTag.id = '_carbonads_js';
    return scriptTag;
  }
}
