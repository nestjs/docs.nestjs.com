import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { RouterLink } from '@angular/router';
import { BannerCoursesAuthComponent } from '../../../../shared/components/banner-courses-auth/banner-courses-auth.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-authentication',
    templateUrl: './authentication.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        CopyButtonComponent,
        TabsComponent,
        RouterLink,
        BannerCoursesAuthComponent,
        ExtensionPipe,
    ],
})
export class AuthenticationComponent extends BasePageComponent {}
