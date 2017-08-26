import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  constructor(private readonly router: Router) { }

  ngOnInit() {
    this.router.events
      .filter((ev) => ev instanceof NavigationEnd)
      .subscribe(() => window.scroll(0, 0));
  }
}