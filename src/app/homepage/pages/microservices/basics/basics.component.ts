import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { BannerEnterpriseComponent } from '../../../../shared/components/banner-enterprise/banner-enterprise.component';
import { RouterLink } from '@angular/router';
import { BannerDevtoolsComponent } from '../../../../shared/components/banner-devtools/banner-devtools.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-basics',
    templateUrl: './basics.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        CopyButtonComponent,
        TabsComponent,
        BannerEnterpriseComponent,
        RouterLink,
        BannerDevtoolsComponent,
        ExtensionPipe,
    ],
})
export class BasicsComponent extends BasePageComponent {}
