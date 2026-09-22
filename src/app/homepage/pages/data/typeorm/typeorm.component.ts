import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { RouterLink } from '@angular/router';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { BannerDevtoolsComponent } from '../../../../shared/components/banner-devtools/banner-devtools.component';
import { BannerEnterpriseComponent } from '../../../../shared/components/banner-enterprise/banner-enterprise.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

@Component({
    selector: 'app-typeorm',
    templateUrl: './typeorm.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        RouterLink,
        CopyButtonComponent,
        TabsComponent,
        HeaderAnchorDirective,
        BannerDevtoolsComponent,
        BannerEnterpriseComponent,
        ExtensionPipe,
    ],
})
export class TypeOrmComponent extends BasePageComponent {}
