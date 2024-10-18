import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-keep-alive-connections',
  templateUrl: './keep-alive-connections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeepAliveConnectionsComponent extends BasePageComponent {}
