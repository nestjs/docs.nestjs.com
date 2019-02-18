import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-lifecycle-events',
  templateUrl: './lifecycle-events.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LifecycleEventsComponent extends BasePageComponent {}
