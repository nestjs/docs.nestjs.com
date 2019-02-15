import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-redis',
  templateUrl: './redis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedisComponent extends BasePageComponent {}
