import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-redis',
  templateUrl: './redis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RedisComponent extends BasePageComponent {
  get options() {
    return `
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.REDIS,
  options: {
    url: 'redis://localhost:6379',
  },
});`;
  }
}