import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-schema-generator',
  templateUrl: './schema-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaGeneratorComponent extends BasePageComponent {}
