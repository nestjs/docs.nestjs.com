import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-swc',
  templateUrl: './swc.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwcComponent extends BasePageComponent {}
