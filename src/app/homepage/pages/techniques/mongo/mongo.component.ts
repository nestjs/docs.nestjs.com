import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mongo',
  templateUrl: './mongo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MongoComponent extends BasePageComponent {}
