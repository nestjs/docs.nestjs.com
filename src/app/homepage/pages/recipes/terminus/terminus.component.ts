import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-terminus',
  templateUrl: './terminus.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminusComponent extends BasePageComponent {}
