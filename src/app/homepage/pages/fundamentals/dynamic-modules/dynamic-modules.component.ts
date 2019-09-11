import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-dynamic-modules',
  templateUrl: './dynamic-modules.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicModulesComponent extends BasePageComponent {}
