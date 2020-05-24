import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-timeout',
  templateUrl: './timeout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicroservicesTimeoutComponent extends BasePageComponent {}
