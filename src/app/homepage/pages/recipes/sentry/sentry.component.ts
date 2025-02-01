import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sentry',
  templateUrl: './sentry.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SentryComponent extends BasePageComponent {}
