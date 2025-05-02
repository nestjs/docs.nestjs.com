import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { RouterLink } from '@angular/router';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { BannerCoursesComponent } from '../../../../shared/components/banner-courses/banner-courses.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-mongo',
    templateUrl: './mongo.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        RouterLink,
        CopyButtonComponent,
        TabsComponent,
        HeaderAnchorDirective,
        BannerCoursesComponent,
        ExtensionPipe,
    ],
})
export class MongoComponent extends BasePageComponent {}
