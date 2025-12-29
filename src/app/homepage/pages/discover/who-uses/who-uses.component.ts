import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';

@Component({
    selector: 'app-who-uses',
    templateUrl: './who-uses.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./who-uses.component.scss'],
    standalone: true,
    imports: [HeaderAnchorDirective],
})
export class WhoUsesComponent extends BasePageComponent {}
