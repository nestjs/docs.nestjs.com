import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-banner-courses-auth',
  templateUrl: './banner-courses-auth.component.html',
  styles: [
    `
      .banner {
        background-color: #111;
        background-image: url('/assets/banners/courses-auth.jpg');
        background-position: center bottom;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCoursesAuthComponent {}
