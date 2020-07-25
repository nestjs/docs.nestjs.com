import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-plugins',
  templateUrl: './plugins.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginsComponent extends BasePageComponent {}
