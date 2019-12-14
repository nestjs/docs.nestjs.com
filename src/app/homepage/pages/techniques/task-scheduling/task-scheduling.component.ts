import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-task-scheduling',
  templateUrl: './task-scheduling.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskSchedulingComponent extends BasePageComponent {}
