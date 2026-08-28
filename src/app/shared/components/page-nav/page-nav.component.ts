import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NAV_ITEMS } from '../../nav/nav-items';
import { findAdjacentPages, NavPage } from '../../nav/nav-sequence';

@Component({
  selector: 'app-page-nav',
  templateUrl: './page-nav.component.html',
  styleUrls: ['./page-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink],
})
export class PageNavComponent implements OnInit, OnDestroy {
  public prev: NavPage | null = null;
  public next: NavPage | null = null;
  public prevLabel = '';
  public nextLabel = '';
  private routerSubscription: Subscription;
  private readonly router = inject(Router);
  private readonly cd = inject(ChangeDetectorRef);

  public ngOnInit(): void {
    // Load-bearing: NavigationEnd for the initial route has already fired by the
    // time this component is created, so the subscription below never sees it.
    // Seeding from the current URL is what gives a directly opened page its links.
    this.updateLinks(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe((ev: NavigationEnd) => {
        this.updateLinks(ev.urlAfterRedirects);
        this.cd.markForCheck();
      });
  }

  public ngOnDestroy(): void {
    if (!this.routerSubscription) {
      return;
    }
    this.routerSubscription.unsubscribe();
  }

  private updateLinks(url: string): void {
    const { prev, next } = findAdjacentPages(NAV_ITEMS, url);
    this.prev = prev;
    this.next = next;
    this.prevLabel = this.buildLabel('Previous', prev);
    this.nextLabel = this.buildLabel('Next', next);
  }

  /**
   * Built here rather than in the template so the visible text and the
   * accessible name cannot drift apart. Several pages share a title
   * ("Overview", "Pipes"), so the chapter is what makes the link unambiguous
   * when it is read out of context.
   */
  private buildLabel(direction: string, page: NavPage | null): string {
    if (!page) {
      return '';
    }
    return page.section
      ? `${direction} page: ${page.title}, in ${page.section}`
      : `${direction} page: ${page.title}`;
  }
}
