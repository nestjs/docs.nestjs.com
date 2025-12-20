import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { RouterLink } from '@angular/router';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';

@Component({
    selector: 'app-caching',
    templateUrl: './caching.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        CopyButtonComponent,
        RouterLink,
        TabsComponent,
    ],
})
export class CachingComponent extends BasePageComponent {}
