import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import 'prismjs/plugins/keep-markup/prism-keep-markup';
import { ApiService } from '../../../../shared/components/api/api.service';
import { PackageCardComponent } from '../../../../shared/components/api/package-card/package-card.component';
import { BasePageComponent } from '../../page/page.component';

/**
 * One generated API page (a package or one of its exports). The page is
 * resolved before the route activates, so it is in the DOM by the time the
 * shell builds the table of contents.
 */
@Component({
  selector: 'app-api-doc',
  template: `
    <div class="content" #contentReference>
      <div class="content-inner">
        <app-package-card
          [name]="packageName"
          [path]="'/api/' + packageName"
          [items]="(items$ | async) ?? null"
          context="detail"
        />
        @if (content) {
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- only intercepts clicks on the links inside, which are focusable -->
          <div
            class="api-doc"
            [innerHTML]="content"
            (click)="onContentClick($event)"
            (pointerover)="prefetchLink($event)"
            (focusin)="prefetchLink($event)"
          ></div>
        } @else {
          <h3>Not found</h3>
          <p>
            There is no API reference page for <code>{{ path }}</code>.
          </p>
        }
      </div>
    </div>
  `,
  styleUrls: ['./api-doc.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, PackageCardComponent],
})
export class ApiDocComponent extends BasePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);

  public readonly packageName: string = this.route.snapshot.params['package'];
  public readonly path = ['/api', ...Object.values(this.route.snapshot.params)].join('/');
  public readonly content = this.trust(this.route.snapshot.data['content']);
  public readonly items$ = this.api
    .getApiList()
    .pipe(
      map(
        (sections) =>
          sections.find((s) => s.title === this.packageName)?.items ?? null,
      ),
    );

  /** Links in the generated HTML are plain anchors; keep them inside the app. */
  public onContentClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (
      !href?.startsWith('/') ||
      anchor.target ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    this.router.navigateByUrl(href);
  }

  public prefetchLink(event: Event): void {
    const href = (event.target as HTMLElement)
      .closest('a')
      ?.getAttribute('href');
    if (href?.startsWith('/api/')) {
      this.api.prefetchDocument(href.split(/[?#]/)[0]);
    }
  }

  // The generated pages are our own build output, so they are trusted as-is.
  private trust(html: string | null): SafeHtml | null {
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  }
}
