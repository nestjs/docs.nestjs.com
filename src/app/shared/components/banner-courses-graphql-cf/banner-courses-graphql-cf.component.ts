import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-banner-courses-graphql-cf',
  templateUrl: './banner-courses-graphql-cf.component.html',
  styles: [
    `
      .banner {
        background-color: #111;
        background-image: url('/assets/banners/courses-graphql-cf.jpg');
        background-position: center bottom;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCoursesGraphQLCodeFirstComponent {}
