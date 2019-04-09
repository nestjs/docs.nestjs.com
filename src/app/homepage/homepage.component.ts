import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
    this.cd.markForCheck();
  }
}
