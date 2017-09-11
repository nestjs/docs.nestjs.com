import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-express-instance',
  templateUrl: './express-instance.component.html',
  styleUrls: ['./express-instance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpressInstanceComponent extends BasePageComponent {}
