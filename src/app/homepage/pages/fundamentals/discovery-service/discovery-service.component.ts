import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-discovery-service',
  templateUrl: './discovery-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoveryServiceComponent extends BasePageComponent {}
