import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-memphis',
  templateUrl: './memphis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemphisComponent extends BasePageComponent {}
