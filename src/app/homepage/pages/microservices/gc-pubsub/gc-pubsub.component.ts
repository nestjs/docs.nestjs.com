import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-gc-pubsub',
  templateUrl: './gc-pubsub.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GCPubSubComponent extends BasePageComponent {}
