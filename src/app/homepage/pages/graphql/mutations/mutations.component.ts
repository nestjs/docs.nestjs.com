import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';

@Component({
    selector: 'app-mutations',
    templateUrl: './mutations.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        RouterLink,
        CopyButtonComponent,
    ],
})
export class MutationsComponent extends BasePageComponent {}
