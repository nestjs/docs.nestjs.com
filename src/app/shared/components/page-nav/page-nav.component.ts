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
  private routerSubscription: Subscription;
  private readonly router = inject(Router);
  private readonly cd = inject(ChangeDetectorRef);

  public ngOnInit(): void {
    // Seeded from the current URL so a page opened directly gets its links too,
    // not only pages reached through an in-app navigation.
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
  }
}
