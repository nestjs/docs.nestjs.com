import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-unions',
  templateUrl: './unions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnionsComponent extends BasePageComponent {}
