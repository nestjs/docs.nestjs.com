import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-multiple-servers',
    templateUrl: './multiple-servers.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CopyButtonComponent,
        HeaderAnchorDirective,
        RouterLink,
    ],
})
export class MultipleServersComponent extends BasePageComponent {}
