import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-devtools-overview',
  templateUrl: './overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevtoolsOverviewComponent extends BasePageComponent {}
