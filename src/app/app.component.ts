import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HOMEPAGE_TITLE, TITLE_SUFFIX } from './constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private robotsElement: HTMLMetaElement;

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
  ) {}

  async ngOnInit() {
    this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe((ev: NavigationEnd) => {
        this.updateTitle();
        this.updateMeta(ev);
      });
  }

  updateTitle() {
    const route = this.activatedRoute.snapshot.firstChild;
    if (!route) {
      return undefined;
    }
    let childRoute = route.firstChild;
    childRoute = childRoute.firstChild ? childRoute.firstChild : childRoute;
    const {
      data: { title },
    } = childRoute;
    const pageTitle = title ? title : HOMEPAGE_TITLE;

    this.titleService.setTitle(pageTitle + TITLE_SUFFIX);
  }

  updateMeta(event: NavigationEnd) {
    if (!(event && event.url)) {
      return;
    }
    const includeBlacklisted = event.url.includes('crud-utilities');
    if (includeBlacklisted && !this.robotsElement) {
      this.robotsElement = this.metaService.addTag({
        name: 'robots',
        content: 'noindex',
      });
    } else if (this.robotsElement) {
      this.metaService.removeTagElement(this.robotsElement);
      this.robotsElement = undefined;
    }
  }
}
