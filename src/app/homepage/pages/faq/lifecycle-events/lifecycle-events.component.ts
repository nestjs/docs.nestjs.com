import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-lifecycle-events',
  templateUrl: './lifecycle-events.component.html',
  styleUrls: ['./lifecycle-events.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LifecycleEventsComponent extends BasePageComponent {}
