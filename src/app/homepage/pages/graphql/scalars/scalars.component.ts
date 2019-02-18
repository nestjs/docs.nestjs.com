import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-scalars',
  templateUrl: './scalars.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScalarsComponent extends BasePageComponent {}
