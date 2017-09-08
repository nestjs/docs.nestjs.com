import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-redis',
  templateUrl: './redis.component.html',
  styleUrls: ['./redis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RedisComponent extends BasePageComponent {}