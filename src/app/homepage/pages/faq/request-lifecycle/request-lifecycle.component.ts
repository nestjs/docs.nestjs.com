import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-request-lifecycle',
  templateUrl: './request-lifecycle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestLifecycleComponent extends BasePageComponent {}
