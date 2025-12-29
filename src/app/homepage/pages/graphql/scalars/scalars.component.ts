import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';

@Component({
    selector: 'app-scalars',
    templateUrl: './scalars.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [HeaderAnchorDirective, CopyButtonComponent],
})
export class ScalarsComponent extends BasePageComponent {}
