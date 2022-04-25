import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sse',
  templateUrl: './server-sent-events.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerSentEventsComponent extends BasePageComponent {}
