import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-queues',
  templateUrl: './queues.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueuesComponent extends BasePageComponent {}
