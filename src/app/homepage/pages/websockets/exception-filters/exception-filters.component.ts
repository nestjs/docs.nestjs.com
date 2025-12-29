import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { RouterLink } from '@angular/router';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';

@Component({
    selector: 'app-exception-filters',
    templateUrl: './exception-filters.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        RouterLink,
        CopyButtonComponent,
        HeaderAnchorDirective,
        TabsComponent,
    ],
})
export class WsExceptionFiltersComponent extends BasePageComponent {}
