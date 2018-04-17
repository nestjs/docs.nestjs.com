import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-hybrid-application',
  templateUrl: './hybrid-application.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HybridApplicationComponent extends BasePageComponent {
  get hybridApplication() {
    return `
const app = await NestFactory.create(ApplicationModule);
const microservice = app.connectMicroservice({
  transport: Transport.TCP,
});

await app.startAllMicroservicesAsync();
await app.listen(3001);`;
  }
}
