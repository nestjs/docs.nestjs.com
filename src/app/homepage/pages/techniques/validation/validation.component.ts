import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-validation',
  templateUrl: './validation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationComponent extends BasePageComponent {}
