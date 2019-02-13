import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-execution-context',
  templateUrl: './application-context.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationContextComponent extends BasePageComponent {}
