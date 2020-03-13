import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-banner-courses',
  templateUrl: './banner-courses.component.html',
  styles: [
    `
      .banner {
        background-color: #111;
        background-image: url('/assets/banners/courses.jpg');
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCoursesComponent {}
