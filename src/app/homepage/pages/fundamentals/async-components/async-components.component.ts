import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-async-components',
  templateUrl: './async-components.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncComponentsComponent extends BasePageComponent {}
