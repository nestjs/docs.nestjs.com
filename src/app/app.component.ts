import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject<Document>(DOCUMENT);

  private robotsElement: HTMLMetaElement;

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
   * index.html is the template for every page, so it carries no canonical URL:
   * one value there would tell search engines that every page is a duplicate
   * of it. This runs when each chapter is prerendered, which puts the page's
   * own canonical in the HTML it is served as, and again in the browser on
   * every navigation. The link is created rather than rewritten, so a page
   * never has two.
   */
  public updateCanonical(event: NavigationEnd): void {
    const path = event.urlAfterRedirects.split(/[?#]/)[0];
    const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`;
    let link = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
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
