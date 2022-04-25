import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-cli-plugin',
  templateUrl: './cli-plugin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CliPluginComponent extends BasePageComponent {}
