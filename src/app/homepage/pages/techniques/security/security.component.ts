import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-securit',
  templateUrl: './security.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityComponent extends BasePageComponent {
  get enableCors() {
    return `
const app = await NestFactory.create(ApplicationModule);
app.enableCors();
await app.listen(3000);`;
  }

  get enableCorsOptions() {
    return `
const app = await NestFactory.create(ApplicationModule, { cors: true });
await app.listen(3000);`;
  }

  get expressRateLimit() {
    return `
import * as rateLimit from 'express-rate-limit';
// somewhere in your initialization file
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));`;
  }
}
