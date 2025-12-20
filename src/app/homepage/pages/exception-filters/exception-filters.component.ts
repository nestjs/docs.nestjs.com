import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { RouterLink } from '@angular/router';
import { BannerCoursesComponent } from '../../../shared/components/banner-courses/banner-courses.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-exception-filters',
    templateUrl: './exception-filters.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        CopyButtonComponent,
        TabsComponent,
        RouterLink,
        BannerCoursesComponent,
        ExtensionPipe,
    ],
})
export class ExceptionFiltersComponent extends BasePageComponent {}
