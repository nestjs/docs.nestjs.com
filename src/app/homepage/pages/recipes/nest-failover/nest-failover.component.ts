import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-nest-failover',
  templateUrl: './nest-failover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NestFailoverComponent extends BasePageComponent {}
