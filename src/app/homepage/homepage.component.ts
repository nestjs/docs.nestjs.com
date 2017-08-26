import { Component, ViewEncapsulation, HostListener, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomepageComponent implements AfterViewInit {
  isSidebarOpened = true;
  toggleSidebar() {
    this.isSidebarOpened = !this.isSidebarOpened;
  }

  ngAfterViewInit() {
    this.checkWindowWidth(window.innerWidth);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.checkWindowWidth(event.target.innerWidth);
  }

  checkWindowWidth(innerWidth?: number) {
    innerWidth = innerWidth ? innerWidth : window.innerWidth;
    if (innerWidth <= 768) {
      this.isSidebarOpened = false;
    }
  }
}
