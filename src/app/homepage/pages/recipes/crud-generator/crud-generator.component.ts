import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-crud-generator',
  templateUrl: './crud-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrudGeneratorComponent extends BasePageComponent {}
