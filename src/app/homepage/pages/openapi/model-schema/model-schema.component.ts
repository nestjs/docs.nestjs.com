import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-openapi-model-schema',
  templateUrl: './model-schema.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelSchemaComponent extends BasePageComponent {}
