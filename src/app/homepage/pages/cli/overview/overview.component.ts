import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';
import { BannerCoursesComponent } from '../../../../shared/components/banner-courses/banner-courses.component';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        RouterLink,
        BannerCoursesComponent,
    ],
})
export class CliOverviewComponent extends BasePageComponent {}
