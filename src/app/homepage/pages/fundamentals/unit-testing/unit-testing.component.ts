import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-unit-testing',
  templateUrl: './unit-testing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitTestingComponent extends BasePageComponent {}
