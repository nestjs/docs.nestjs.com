import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-interfaces',
  templateUrl: './interfaces.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfacesComponent extends BasePageComponent {}
