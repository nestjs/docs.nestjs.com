import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-banner-shop',
  templateUrl: './banner-shop.component.html',
  styles: [
    `
      .banner {
        background-image: url('/assets/banners/shop.jpg');
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerShopComponent {}
