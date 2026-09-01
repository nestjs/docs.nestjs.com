import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NAV_ITEMS } from '../../nav/nav-items';
import { flattenNavItems, normalizeUrl } from '../../nav/nav-sequence';

@Component({
  selector: 'app-copy-markdown',
  templateUrl: './copy-markdown.component.html',
  styleUrls: ['./copy-markdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIcon],
})
export class CopyMarkdownComponent implements OnInit, OnDestroy {
  public markdownUrl: string | null = null;
  public copied = false;
  private routerSubscription: Subscription;
  private revertTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly router = inject(Router);
  private readonly cd = inject(ChangeDetectorRef);

  public ngOnInit(): void {
    this.update(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe((ev: NavigationEnd) => {
        this.update(ev.urlAfterRedirects);
        this.cd.markForCheck();
      });
  }

  public ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    if (this.revertTimeout) {
      clearTimeout(this.revertTimeout);
    }
  }

  public async onCopy(): Promise<void> {
    const text = fetch(this.markdownUrl).then((res) => {
      if (!res.ok) {
        throw new Error(`${this.markdownUrl}: ${res.status}`);
      }
      return res.text();
    });
    // Safari only honours clipboard writes issued inside the click handler, so
    // the fetch is handed over as a promise instead of awaited first.
    if (typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': text.then((t) => new Blob([t], { type: 'text/plain' })),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(await text);
    }

    this.copied = true;
    this.cd.markForCheck();
    this.revertTimeout = setTimeout(() => {
      this.copied = false;
      this.revertTimeout = null;
      this.cd.markForCheck();
    }, 2000);
  }

  private update(url: string): void {
    const path = normalizeUrl(url);
    const known = flattenNavItems(NAV_ITEMS).some((page) => page.path === path);
    this.markdownUrl = known ? `${path === '/' ? '/index' : path}.md` : null;
  }
}
