import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-express-instance',
  templateUrl: './express-instance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpressInstanceComponent extends BasePageComponent {
  get expressInstance() {
    return `
const server = express();
const app = await NestFactory.create(ApplicationModule, server);`;
  }
}
