import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-helmet',
  templateUrl: './helmet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelmetComponent extends BasePageComponent {}
