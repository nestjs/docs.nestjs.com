import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mongodb',
  templateUrl: './mongodb.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MongodbComponent extends BasePageComponent {}
