import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { RouterLink } from '@angular/router';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';

@Component({
    selector: 'app-async-components',
    templateUrl: './async-components.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CopyButtonComponent,
        RouterLink,
        HeaderAnchorDirective,
    ],
})
export class AsyncComponentsComponent extends BasePageComponent {}
