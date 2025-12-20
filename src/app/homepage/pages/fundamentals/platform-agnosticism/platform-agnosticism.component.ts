import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-platform-agnosticism',
    templateUrl: './platform-agnosticism.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [HeaderAnchorDirective, RouterLink],
})
export class PlatformAgnosticismComponent extends BasePageComponent {}
