import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-global-prefix',
  templateUrl: './global-prefix.component.html',
  styleUrls: ['./global-prefix.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalPrefixComponent extends BasePageComponent {
  get globalPrefix() {
    return `
const app = await NestFactory.create(ApplicationModule);
app.setGlobalPrefix('v1');`;
  }
}