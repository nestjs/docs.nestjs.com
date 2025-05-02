import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { RouterLink } from '@angular/router';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { BannerEnterpriseComponent } from '../../../../shared/components/banner-enterprise/banner-enterprise.component';

@Component({
    selector: 'app-openapi-types-parameters',
    templateUrl: './types-and-parameters.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CopyButtonComponent,
        RouterLink,
        HeaderAnchorDirective,
        BannerEnterpriseComponent,
    ],
})
export class TypesAndParametersComponent extends BasePageComponent {}
