import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-caching',
  templateUrl: './caching.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CachingComponent extends BasePageComponent {}
