import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';

@Component({
    selector: 'app-lifecycle-events',
    templateUrl: './lifecycle-events.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        CopyButtonComponent,
        TabsComponent,
    ],
})
export class LifecycleEventsComponent extends BasePageComponent {}
