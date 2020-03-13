import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-banner-enterprise',
  templateUrl: './banner-enterprise.component.html',
  styles: [
    `
      .banner {
        background-color: #111;
        background-image: url('/assets/banners/enterprise.jpg');
      }
      .banner ul {
        max-width: 820px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerEnterpriseComponent {}
