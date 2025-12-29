import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';
import { CopyButtonComponent } from '../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { BannerCoursesComponent } from '../../../shared/components/banner-courses/banner-courses.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-first-steps',
    templateUrl: './first-steps.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        RouterLink,
        CopyButtonComponent,
        TabsComponent,
        BannerCoursesComponent,
        ExtensionPipe,
    ],
})
export class FirstStepsComponent extends BasePageComponent {}
