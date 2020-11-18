import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-errors',
  templateUrl: './errors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorsComponent extends BasePageComponent {}
