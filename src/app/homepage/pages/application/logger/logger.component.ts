import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { BannerCoursesComponent } from '../../../../shared/components/banner-courses/banner-courses.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-logger',
    templateUrl: './logger.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        CopyButtonComponent,
        BannerCoursesComponent,
        RouterLink,
    ],
})
export class LoggerComponent extends BasePageComponent {}
