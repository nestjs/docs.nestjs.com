import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-repl',
  templateUrl: './repl.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplComponent extends BasePageComponent {}
