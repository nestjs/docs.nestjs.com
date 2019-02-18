import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoggerComponent extends BasePageComponent {}
