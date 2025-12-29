import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { RouterLink } from '@angular/router';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { BannerEnterpriseComponent } from '../../../../shared/components/banner-enterprise/banner-enterprise.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-gateways',
    templateUrl: './gateways.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        RouterLink,
        HeaderAnchorDirective,
        CopyButtonComponent,
        TabsComponent,
        BannerEnterpriseComponent,
        ExtensionPipe,
    ],
})
export class GatewaysComponent extends BasePageComponent {}
