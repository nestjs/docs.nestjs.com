import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-execution-context',
  templateUrl: './execution-context.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionContextComponent extends BasePageComponent {}
