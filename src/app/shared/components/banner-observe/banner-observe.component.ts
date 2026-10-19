import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-banner-observe',
    templateUrl: './banner-observe.component.html',
    styles: [
        `
      .banner {
        background-color: #111;
        background-image: url('/assets/banners/courses-graphql-sf.jpg');
      }
    `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class BannerObserveComponent {}
