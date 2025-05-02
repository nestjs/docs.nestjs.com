import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';
import { HeaderAnchorDirective } from '../../../shared/directives/header-anchor.directive';
import { CopyButtonComponent } from '../../../shared/components/copy-button/copy-button.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-migration',
    templateUrl: './migration.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        HeaderAnchorDirective,
        CopyButtonComponent,
        RouterLink,
    ],
})
export class MigrationComponent extends BasePageComponent {}
