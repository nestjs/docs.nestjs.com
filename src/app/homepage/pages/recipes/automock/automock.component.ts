import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-automock',
  templateUrl: './automock.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomockComponent extends BasePageComponent {}
