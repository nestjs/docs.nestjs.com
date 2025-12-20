import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { BannerCoursesAuthComponent } from '../../../../shared/components/banner-courses-auth/banner-courses-auth.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-authorization',
    templateUrl: './authorization.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        RouterLink,
        CopyButtonComponent,
        TabsComponent,
        BannerCoursesAuthComponent,
        ExtensionPipe,
    ],
})
export class AuthorizationComponent extends BasePageComponent {}
