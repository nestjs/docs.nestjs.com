import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';

@Component({
    selector: 'app-schema-generator',
    templateUrl: './schema-generator.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CopyButtonComponent, HeaderAnchorDirective],
})
export class SchemaGeneratorComponent extends BasePageComponent {}
