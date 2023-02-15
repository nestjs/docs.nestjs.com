import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-banner-courses-graphql-sf',
  templateUrl: './banner-courses-graphql-sf.component.html',
  styles: [
    `
      .banner {
        background-color: #111;
        background-image: url('/assets/banners/courses-graphql-sf.jpg');
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCoursesGraphQLSchemaFirstComponent {}
