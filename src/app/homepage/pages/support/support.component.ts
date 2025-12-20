import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';

@Component({
    selector: 'app-support',
    templateUrl: './support.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [HeaderAnchorDirective],
})
export class SupportComponent extends BasePageComponent {}