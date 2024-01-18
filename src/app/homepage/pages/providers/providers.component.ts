import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-components',
  templateUrl: './providers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProvidersComponent extends BasePageComponent {}
