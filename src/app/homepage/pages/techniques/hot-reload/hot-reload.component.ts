import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-hot-reload',
  templateUrl: './hot-reload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotReloadComponent extends BasePageComponent {}
