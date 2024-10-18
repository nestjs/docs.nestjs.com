import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-devtools-ci-cd',
  templateUrl: './ci-cd.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevtoolsCiCdComponent extends BasePageComponent {}
