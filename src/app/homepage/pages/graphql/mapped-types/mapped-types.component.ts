import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mapped-types',
  templateUrl: './mapped-types.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MappedTypesComponent extends BasePageComponent {}
