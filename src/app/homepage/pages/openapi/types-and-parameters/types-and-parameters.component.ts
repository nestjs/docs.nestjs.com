import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-openapi-types-parameters',
  templateUrl: './types-and-parameters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypesAndParametersComponent extends BasePageComponent {}
