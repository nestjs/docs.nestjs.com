import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';

@Component({
    selector: 'app-hybrid-application',
    templateUrl: './hybrid-application.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CopyButtonComponent,
        TabsComponent,
        HeaderAnchorDirective,
    ],
})
export class HybridApplicationComponent extends BasePageComponent {}
