
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { RouterLink } from '@angular/router';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';

@Component({
    selector: 'app-nest-commander',
    templateUrl: './nest-commander.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        RouterLink,
        HeaderAnchorDirective,
        CopyButtonComponent,
    ],
})
export class NestCommanderComponent extends BasePageComponent {}
