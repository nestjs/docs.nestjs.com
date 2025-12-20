import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { BannerCoursesGraphQLCodeFirstComponent } from '../../../../shared/components/banner-courses-graphql-cf/banner-courses-graphql-cf.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-quick-start',
    templateUrl: './quick-start.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        BannerCoursesGraphQLCodeFirstComponent,
        CopyButtonComponent,
        TabsComponent,
        RouterLink,
    ],
})
export class QuickStartComponent extends BasePageComponent {}
