import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-controllers',
  templateUrl: './controllers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControllersComponent extends BasePageComponent {}
