import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-rate-limiting',
  templateUrl: './rate-limiting.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RateLimitingComponent extends BasePageComponent {}
