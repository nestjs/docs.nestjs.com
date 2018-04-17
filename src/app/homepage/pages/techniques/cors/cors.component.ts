import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-cors',
  templateUrl: './cors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorsComponent extends BasePageComponent {
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
}
