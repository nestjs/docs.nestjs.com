import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HOMEPAGE_TITLE, SITE_URL, TITLE_SUFFIX } from './constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit {
  private robotsElement: HTMLMetaElement;

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  public async ngOnInit(): Promise<void> {
    this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe((ev: NavigationEnd) => {
        this.updateTitle();
        this.updateMeta(ev);
        this.updateCanonical(ev);
      });
  }

  public updateTitle(): void {
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

    const fullTitle = pageTitle + TITLE_SUFFIX;
    this.titleService.setTitle(fullTitle);
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
  }

  /**
   * index.html ships one canonical URL - the site root - for every route, and
   * a page whose canonical points elsewhere is telling search engines it is a
   * duplicate of that page. Netlify's prerenderer runs this code, so crawlers
   * receive the per-page value.
   */
  public updateCanonical(event: NavigationEnd): void {
    const path = event.urlAfterRedirects.split(/[?#]/)[0];
    const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`;
    const link = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    link?.setAttribute('href', url);
    this.metaService.updateTag({ property: 'og:url', content: url });
  }

  public updateMeta(event: NavigationEnd): void {
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
