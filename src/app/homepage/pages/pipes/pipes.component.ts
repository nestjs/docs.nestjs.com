import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { RouterLink } from '@angular/router';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { BannerCoursesComponent } from '../../../shared/components/banner-courses/banner-courses.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-pipes',
    templateUrl: './pipes.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        RouterLink,
        HeaderAnchorDirective,
        CopyButtonComponent,
        TabsComponent,
        BannerCoursesComponent,
        ExtensionPipe,
    ],
})
export class PipesComponent extends BasePageComponent {}
