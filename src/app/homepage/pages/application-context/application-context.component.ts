import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-application-context',
    templateUrl: './application-context.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        CopyButtonComponent,
        TabsComponent,
        RouterLink,
    ],
})
export class ApplicationContextComponent extends BasePageComponent {}
